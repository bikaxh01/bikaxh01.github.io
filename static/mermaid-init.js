document.addEventListener("DOMContentLoaded", function () {
    // Zola puts data-lang on the <code> element, not the <pre>
    var codeBlocks = document.querySelectorAll("code[data-lang='mermaid']");

    if (codeBlocks.length === 0) return;

    if (typeof mermaid === "undefined") {
        console.error("mermaid-init: mermaid.js failed to load, leaving diagram source as code blocks");
        return;
    }

    // Keep the original markup around so a failed render can restore it
    // instead of leaving the reader with an empty page region.
    var replacements = Array.prototype.map.call(codeBlocks, function (code) {
        var pre = code.parentElement;
        var mermaidDiv = document.createElement("div");
        mermaidDiv.className = "mermaid";
        mermaidDiv.style.cssText = "background: #1e1e2e; border-radius: 12px; padding: 24px; display: flex; justify-content: center;";
        mermaidDiv.textContent = code.textContent;

        // Check if copy-button.js wrapped it in a .pre-container
        var original = pre.closest(".pre-container") || pre;

        return { original: original, target: mermaidDiv };
    });

    try {
        mermaid.initialize({ startOnLoad: false, theme: "dark" });
    } catch (error) {
        console.error("mermaid-init: mermaid.initialize() failed", error);
        return;
    }

    replacements.forEach(function (replacement) {
        replacement.original.replaceWith(replacement.target);
    });

    function restore(replacement, error) {
        console.error("mermaid-init: failed to render diagram", error);
        replacement.target.replaceWith(replacement.original);
    }

    // Render one diagram at a time so a single invalid diagram cannot
    // prevent the remaining ones from rendering.
    replacements.forEach(function (replacement) {
        var node = replacement.target;

        if (typeof mermaid.run === "function") {
            var result;
            try {
                result = mermaid.run({ nodes: [node], suppressErrors: false });
            } catch (error) {
                restore(replacement, error);
                return;
            }
            if (result && typeof result.catch === "function") {
                result.catch(function (error) {
                    restore(replacement, error);
                });
            }
            return;
        }

        try {
            mermaid.init(undefined, [node]);
        } catch (error) {
            restore(replacement, error);
        }
    });
});
