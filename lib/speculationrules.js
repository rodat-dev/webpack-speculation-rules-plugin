/** 
 * @summary Instant navigation page load with the Speculation rules API 
 * @description adds speculation rules if the browser supports it or
 * 'prerender' links if not (for all same-origin anchors);
 * 
 * @link https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API
 * @link https://developer.chrome.com/docs/web-platform/prerender-pages
*/
class SpeculationRulesBuilder {
    constructor() {
        this.rules = process.env.__SPECULATION_RULES;
        this.addRules = this.addRules.bind(this);
    }

    addRules() {
        console.group("[SPECULATION]");
        console.info("rules:", this.rules);
        if(HTMLScriptElement.supports && HTMLScriptElement.supports("speculationrules")) {
            const script = document.createElement("script");
            script.type = "speculationrules";
            script.textContent = JSON.stringify(rules);
            document.body.appendChild(script);
            console.info("added speculation rules to the page");
        } else {
            console.warn("browser does not support speculation rules, adding prerender links...");
            const links = Array.from(document
                .querySelectorAll("a"))
                .filter(anchor => new URL(anchor.href).origin === window.location.origin)
                .map(anchor => {
                    const link = document.createElement("link");
                    link.rel = "prerender";
                    link.href = anchor.href;
                });
            document.head.append(...links);
        }
        console.groupEnd();
    }
}

const speculationRulesBuilder = new SpeculationRulesBuilder();

window.addEventListener("pageshow", (event) => {
    const navigationType = performance.getEntriesByType("navigation")[0].entryType;
    if(event.persisted || navigationType == "back_forward") {
        const specScript = document.querySelector("script[type='speculationrules']");
        if(specScript) specScript.remove();
        speculationRulesBuilder.addRules();
    }
});

speculationRulesBuilder.addRules();
console.info("added speculation rules on first page load...");
