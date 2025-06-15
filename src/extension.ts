// src/extension.ts
import * as vscode from "vscode";
import * as fs from "fs-extra";
import * as path from "path";
import * as cheerio from "cheerio";
import * as glob from "glob";
import postcss, { Rule } from "postcss";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand("assets-cleaner.cleanProject", () => {
    runCleaner();
  });

  context.subscriptions.push(disposable);

  async function runCleaner() {
    vscode.window.showInformationMessage("Assets Cleaner: Scanning project...");

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage("No workspace is open!");
      return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const removedFolder = path.join(rootPath, "removed");
    fs.ensureDirSync(removedFolder);

    const htmlFiles = glob.sync(`${rootPath}/**/*.html`, {
      ignore: "**/node_modules/**",
    });

    const cssFiles = glob.sync(`${rootPath}/**/*.css`, {
      ignore: "**/node_modules/**",
    });

    const jsFiles = glob.sync(`${rootPath}/**/*.js`, {
      ignore: "**/node_modules/**",
    });

    const imageFiles = glob.sync(`${rootPath}/**/*.{png,jpg,jpeg,gif,svg,webp}`, {
      ignore: "**/node_modules/**",
    });

    const usedClasses = new Set<string>();
    const usedIDs = new Set<string>();
    const usedTags = new Set<string>();
    const usedCSSFiles = new Set<string>();
    const usedJSFiles = new Set<string>();
    const usedImages = new Set<string>();

    const report = {
      removedCSSFiles: [] as string[],
      removedJSFiles: [] as string[],
      removedImages: [] as string[],
      removedSelectors: [] as string[],
      removedInlineSelectors: [] as string[],
      cssUsageMap: {} as Record<string, string[]>,
    };

    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Assets Cleaner: Cleaning project...",
      cancellable: false,
    }, async (progress) => {
      progress.report({ message: "Scanning HTML files..." });

      for (const file of htmlFiles) {
        const content = fs.readFileSync(file, "utf-8");
        const $ = cheerio.load(content);

        $(`[class]`).each((_, el) => {
          const classAttr = $(el).attr("class") || "";
          classAttr.split(/\s+/).forEach(cls => usedClasses.add(cls));
        });

        $(`[id]`).each((_, el) => {
          const idAttr = $(el).attr("id") || "";
          usedIDs.add(idAttr);
        });

        $("*").each((_, el) => {
          const tag = (el as any).tagName;
          if (tag) usedTags.add(tag.toLowerCase());
        });

        $(`link[rel='stylesheet']`).each((_, el) => {
          const href = $(el).attr("href");
          if (href) {
            const fullPath = resolveAssetPath(file, href, rootPath);
            usedCSSFiles.add(fullPath);
            if (!report.cssUsageMap[fullPath]) report.cssUsageMap[fullPath] = [];
            report.cssUsageMap[fullPath].push(file);
          }
        });

        $(`script[src]`).each((_, el) => {
          const src = $(el).attr("src");
          if (src) usedJSFiles.add(resolveAssetPath(file, src, rootPath));
        });

        $(`img[src]`).each((_, el) => {
          const src = $(el).attr("src");
          if (src) usedImages.add(resolveAssetPath(file, src, rootPath));
        });

        let changed = false;
        $(`style`).each((_, el) => {
          const styleContent = $(el).html() || "";
          const root = postcss.parse(styleContent);
          const safeRules: Rule[] = [];

          root.walkRules((rule: Rule) => {
            const selectors = rule.selectors || [];
            const filtered = selectors.filter(selector => {
              const matchedClasses = Array.from(selector.matchAll(/\.([a-zA-Z0-9_-]+)/g)).map(m => m[1]);
              const matchedIDs = Array.from(selector.matchAll(/#([a-zA-Z0-9_-]+)/g)).map(m => m[1]);
              const matchedTags = Array.from(selector.matchAll(/(^|\s)([a-zA-Z][a-zA-Z0-9]*)/g)).map(m => m[2]);
              return (
                matchedClasses.some(cls => usedClasses.has(cls)) ||
                matchedIDs.some(id => usedIDs.has(id)) ||
                matchedTags.some(tag => usedTags.has(tag))
              );
            });

            if (filtered.length > 0) {
              rule.selectors = filtered;
              safeRules.push(rule);
            } else {
              report.removedInlineSelectors.push(...selectors);
              changed = true;
            }
          });

          if (changed) {
            const filteredRoot = postcss.root();
            safeRules.forEach(rule => filteredRoot.append(rule));
            $(el).html(filteredRoot.toString());
          }
        });

        if (changed) {
          fs.writeFileSync(file, $.html(), "utf-8");
        }
      }

      progress.report({ message: "Scanning external CSS for rule usage..." });

      for (const cssFile of cssFiles) {
        const cssContent = fs.readFileSync(cssFile, "utf-8");
        const root = postcss.parse(cssContent);
        const safeRules: Rule[] = [];

        root.walkRules((rule: Rule) => {
          const selectors = rule.selectors || [];
          const filtered = selectors.filter(selector => {
            const matchedClasses = Array.from(selector.matchAll(/\.([a-zA-Z0-9_-]+)/g)).map(m => m[1]);
            const matchedIDs = Array.from(selector.matchAll(/#([a-zA-Z0-9_-]+)/g)).map(m => m[1]);
            const matchedTags = Array.from(selector.matchAll(/(^|\s)([a-zA-Z][a-zA-Z0-9]*)/g)).map(m => m[2]);
            return (
              matchedClasses.some(cls => usedClasses.has(cls)) ||
              matchedIDs.some(id => usedIDs.has(id)) ||
              matchedTags.some(tag => usedTags.has(tag))
            );
          });

          if (filtered.length > 0) {
            rule.selectors = filtered;
            safeRules.push(rule);
          } else {
            report.removedSelectors.push(...selectors);
          }
        });

        const filteredRoot = postcss.root();
        safeRules.forEach(rule => filteredRoot.append(rule));
        fs.writeFileSync(cssFile, filteredRoot.toString());
      }

      progress.report({ message: "Removing unused assets..." });

      cssFiles.forEach(cssFile => {
        if (!usedCSSFiles.has(path.normalize(cssFile))) {
          moveFile(cssFile, path.join(removedFolder, "css"), report.removedCSSFiles);
        }
      });

      jsFiles.forEach(jsFile => {
        if (!usedJSFiles.has(path.normalize(jsFile))) {
          moveFile(jsFile, path.join(removedFolder, "js"), report.removedJSFiles);
        }
      });

      imageFiles.forEach(imgFile => {
        if (!usedImages.has(path.normalize(imgFile))) {
          moveFile(imgFile, path.join(removedFolder, "images"), report.removedImages);
        }
      });

      fs.writeFileSync(
        path.join(removedFolder, "assets-cleaner-report.json"),
        JSON.stringify(report, null, 2),
        "utf-8"
      );

      vscode.window.showInformationMessage("Assets Cleaner completed! Check /removed/ folder for details.");
    });
  }

  function resolveAssetPath(baseFile: string, assetPath: string, rootPath: string): string {
    if (assetPath.startsWith("/")) {
      return path.normalize(path.join(rootPath, assetPath));
    } else {
      return path.normalize(path.resolve(path.dirname(baseFile), assetPath));
    }
  }

  function moveFile(filePath: string, targetDir: string, reportArr: string[]) {
    const targetPath = path.join(targetDir, path.basename(filePath));
    fs.ensureDirSync(targetDir);
    fs.moveSync(filePath, targetPath, { overwrite: true });
    reportArr.push(filePath);
  }
}

export function deactivate() {}
