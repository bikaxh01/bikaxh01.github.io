(function() {
    const terminal = document.getElementById('boot-terminal');
    if (!terminal) return;
    const lines = [
        "╭──────────────────────────────────────────────╮",
        "│ SYSTEM INITIALIZATION v2.4                   │",
        "╰──────────────────────────────────────────────╯",
        "",
        "Booting dev server...",
        "Loading Docker containers...",
        "Starting database...",
        "Compiling frontend assets...",
        "Brewing coffee ☕",
        "All systems operational.",
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%",
        "",
        "Developer  : Bikash",
        "Origin     : Earth 🌍",
        "Role       : Full Stack Developer",
        "Stack      : React • Node.js • Python • SQL",
        "",
        "Status     : READY_FOR_CODE",
        "",
        "awaiting_user_input..."
    ];
    let currentLine = 0;
    let currentChar = 0;
    function typeLine() {
        if (currentLine >= lines.length) {
            setInterval(function() {
                let text = terminal.textContent;
                if (text.endsWith("█")) {
                    terminal.textContent = text.slice(0, -1) + " ";
                } else {
                    terminal.textContent = text.slice(0, -1) + "█";
                }
            }, 500);
            return;
        }
        let lineText = lines[currentLine];
        let delay = 2;
        if (currentChar === 0 && currentLine > 0) {
            terminal.textContent = terminal.textContent.replace(/█$/, "") + "\n█";
        }
        if (currentChar < lineText.length) {
            let text = terminal.textContent.replace(/█$/, "");
            terminal.textContent = text + lineText[currentChar] + "█";
            currentChar++;
            setTimeout(typeLine, delay);
        } else {
            currentLine++;
            currentChar = 0;
            let lineDelay = 40;
            setTimeout(typeLine, lineDelay);
        }
    }
    terminal.textContent = "█";
    setTimeout(typeLine, 100);
})();
