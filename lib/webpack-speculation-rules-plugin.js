import HtmlWebpackPlugin from 'html-webpack-plugin';
import pkg, { Compiler } from "webpack";
const { Compilation } = pkg;
import nodePath from "node:path";
import fs from "node:fs";

class SpeculationRulesPlugin {
    rules;

    static defaultRules = {
        "prerender": [
            {
                "where": { "href_matches": "/*" },
                "eagerness": "eager"
            }
        ]
    };

    constructor(rules = SpeculationRulesPlugin.defaultRules) {
        this.rules = rules;
    }

    apply(compiler) {
        compiler.hooks.thisCompilation.tap('SpeculationRulesPlugin', (compilation) => {
            HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tap(
                'SpeculationRulesPlugin',
                (data) => {
                    const speculationScript = {
                        tagName: "script",
                        voidTag: false,
                        attributes: { src: "speculationrules.js", type: "module" },
                        meta: {}
                    };
                    data.headTags.push(speculationScript);
                    return data;
                }
            );

            compilation.hooks.processAssets.tap({
                name: 'SpeculationRulesPlugin',
                stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
            },
            (_assets) => {
                const speculationRulesPath = nodePath.resolve(__dirname, "speculationrules.js");
                const content = fs.readFileSync(speculationRulesPath, { encoding: "utf-8" });
                content.replace("process.env.__SPECULATION_RULES", JSON.stringify(this.rules, null, "\t"));

                compilation.emitAsset(
                    `speculationrules.js`,
                    new compiler.webpack.sources.RawSource(content),
                );
            });
                            
        });
    }
}

module.exports = { SpeculationRulesPlugin };