// Initialize console and command input elements
const consoleElement = document.querySelector("#console");
const commandBar = document.querySelector("#commandBar");

const Console = {
    username: "denis", // Default username
    contents: [], // Console output history
    currentDir: "/", // Tracks current directory
    cdStringRepr: "/", // Tracks current directory with home path replaced by ~
    fileSystem: {
		"/": {
			"home": {},
			"start.prg": JSON.stringify(["touch ONSAVING.txt","edit ONSAVING.txt if you are reading this, you may want to know how to save your file system! Well it's quite simple. Go to your inspect element console and type the following command. \n\nJSON.stringify(Console.fileSystem);\n\nThis will print out a string. Copy this and save it. In the future, to load this string, just type this command. \n\nConsole.fileSystem = `your string`;\n\n Make sure you keep the little `` things, they make sure your string is interpreted as one. Tschüss!"]),
		},
		"/home": {

		},
	},
    commands: {}, // Holds all available commands
	logMessages: false, // Determines whether or not to output messages to console
};

// Utility functions to handle console output
Console.log = (message,forcelog) => {
	if (Console.logMessages || forcelog) Console.contents.push(message);
    consoleElement.innerText = Console.contents.join("");
};

Console.replace = (message) => {
    if (Console.logMessages) Console.contents.pop();
    if (Console.logMessages) Console.contents.push(message);
    consoleElement.innerText = Console.contents.join("");
};

// Formats and returns command prompt string
Console.commandRunString = (command) => `\n< ${Console.username} | ${Console.cdStringRepr} $> ${command}`;

// Function to register a new command with a callback
Console.createCommand = (name, description, callback) => {
    Console.commands[name] = { name, description, callback };

    // Sort commands alphabetically by command name
    Console.commands = Object.keys(Console.commands)
        .sort()
        .reduce((sorted, key) => {
            sorted[key] = Console.commands[key];
            return sorted;
        }, {});
};

// Runs command based on user input
Console.commandRun = (input,userinput) => {
	Console.logMessages = userinput;
	if (userinput) Console.replace(Console.commandRunString(input));
    commandBar.value = ""; // Clear input field
    const args = input.split(" ");
    const command = Console.commands[args[0]];
    if (command) {
        command.callback(args);
    } else {
        Console.log("\nCommand not found");
    }
    if (userinput) Console.log(Console.commandRunString(""));
};

// runs list of commands based off of array string
Console.runProgram = (program) => {
	JSON.parse(program).forEach((instruction) => {Console.commandRun(instruction);});
};

// Command Definitions

// Command: echo - Outputs text to the console
Console.createCommand("echo", "Displays text in the console", (args) => {
    args.shift(); // Remove command name
    Console.log("\n" + args.join(" "));
});

// Command: username - Sets the console username
Console.createCommand("username", "Sets the username", (args) => {
    const newUsername = args[1] || Console.username;
    if (newUsername !== Console.username) {
        Console.username = newUsername;
    }
});

// Command: color - Sets text and background color of console
Console.createCommand("color", "Sets text and background color", (args) => {
    consoleElement.style.color = args[1];
    if (args[2]) consoleElement.style.backgroundColor = args[2];
});

// Command: help - Lists all available commands
Console.createCommand("help", "Lists all commands", () => {
    const commandList = Object.keys(Console.commands)
        .map((cmd) => `${cmd} - ${Console.commands[cmd].description}`)
        .join("\n");
    Console.log(`\n${commandList}`);
});

// Command: cwd - Prints current working directory
Console.createCommand("cwd", "Prints the current directory", () => {
    Console.log(`\n${Console.cdStringRepr}`);
});

// Command: cd - Changes directory
Console.createCommand("cd", "Changes directory", (args) => {
    let targetDir = args[1];

    // Normalize targetDir (remove leading/trailing slashes and handle '~')
    if (targetDir) targetDir = targetDir.replace(/^\/|\/$/g, "");
    if (targetDir && targetDir.startsWith("~")) {
        targetDir = `/home${targetDir.slice(1)}`;
    }

    if (targetDir === "..") {
        // Move up a directory
        const dirs = Console.currentDir.split("/").filter(Boolean);
        dirs.pop();
        Console.currentDir = dirs.length ? `/${dirs.join("/")}` : "/";
    } else if (Console.fileSystem[Console.currentDir][targetDir] || Console.fileSystem[targetDir]) {
        // Change to a valid directory
        Console.currentDir = `/${targetDir}`.replace("//", "/");
    } else {
        Console.log(`\nDirectory not found: ${targetDir}`);
        return;
    }

    // Update cdStringRepr
    Console.cdStringRepr = Console.currentDir.startsWith("/home") 
        ? Console.currentDir.replace("/home", "~") 
        : Console.currentDir;
});

// Command: mkdir - Creates a new directory
Console.createCommand("mkdir", "Creates a new directory", (args) => {
    const newDirName = args[1]?.replace(/^\/|\/$/g, "");
    if (!newDirName) {
        Console.log("\nError: Directory name cannot be empty.");
        return;
    }
    if (Console.fileSystem[Console.currentDir][newDirName]) {
        Console.log(`\nError: Directory "${newDirName}" already exists.`);
        return;
    }
    Console.fileSystem[Console.currentDir][newDirName] = {};
    Console.log(`\nDirectory created: ${newDirName}`);
});

// Command: ls - Lists files and directories in the current directory
Console.createCommand("ls", "Lists files and directories", () => {
    const contents = Object.keys(Console.fileSystem[Console.currentDir])
        .map((name) => (Console.fileSystem[Console.currentDir][name] instanceof Object ? `/${name}` : name))
        .join(" ");
    Console.log(`\n${contents}`);
});

// Command: cat - Displays contents of a file
Console.createCommand("cat", "Displays a file's contents", (args) => {
    const fileName = args[1];
    const fileContent = Console.fileSystem[Console.currentDir][fileName];
    Console.log(fileContent !== undefined ? `\n${fileContent}` : `\nFile not found: ${fileName}`);
});

// Command: clear - Clears console history
Console.createCommand("clear", "Clears console", () => {
    Console.contents = ["Console cleared"];
    consoleElement.innerText = Console.contents.join(""); // Ensure output is cleared
});

// Command: touch - Creates an empty file in the current directory
Console.createCommand("touch", "Creates a file", (args) => {
    const fileName = args[1];
    Console.fileSystem[Console.currentDir][fileName] = "";
    Console.log(`\nFile created: ${fileName}`);
});

// Command: edit - Edits an existing file or creates a new one
Console.createCommand("edit", "Edits a file", (args) => {
    const fileName = args[1];
    const content = args.slice(2).join(" ");
    Console.fileSystem[Console.currentDir][fileName] = content;
    Console.log(`\nFile updated: ${fileName}`);
});

Console.createCommand("run", "Runs a program", (args) => {
	const fileName = args[1];
    const fileContent = Console.fileSystem[Console.currentDir][fileName];
	if (fileContent !== undefined || fileName.endsWith(".prg")) {
		Console.logMessages = false;
		Console.runProgram(fileContent);
		Console.logMessages = true;
	} else {
		Console.log(`\nFile not found, or is not of .prg type: ${fileName}`);
	};
});

// Initial setup and event listener
(() => {
	Console.commandRun("run start.prg");
	Console.logMessages = true;
    Console.log("denisCLI");
    Console.log(Console.commandRunString(""));
})();
window.addEventListener("keydown", (e) => {
    if (e.key === "Enter") Console.commandRun(commandBar.value,true);
});