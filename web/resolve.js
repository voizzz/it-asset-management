const fs = require('fs');

function resolveConflictsInFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('<<<<<<< HEAD')) return;

    const lines = content.split('\n');
    const newLines = [];
    let state = 'NORMAL'; // NORMAL, IN_HEAD, IN_INCOMING

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('<<<<<<< HEAD')) {
            state = 'IN_HEAD';
        } else if (line.startsWith('=======')) {
            if (state === 'IN_HEAD') {
                state = 'IN_INCOMING';
            } else {
                newLines.push(line);
            }
        } else if (line.startsWith('>>>>>>> ')) {
            if (state === 'IN_INCOMING') {
                state = 'NORMAL';
            } else {
                newLines.push(line);
            }
        } else {
            if (state === 'NORMAL') {
                newLines.push(line);
            } else if (state === 'IN_INCOMING') {
                newLines.push(line);
            }
        }
    }

    fs.writeFileSync(filePath, newLines.join('\n'));
    console.log(`Resolved: ${filePath}`);
}

const filesWithConflicts = [
    "c:\\Users\\Asus\\Downloads\\it-asset-management-main\\web\\src\\app\\DashboardClient.tsx",
    "c:\\Users\\Asus\\Downloads\\it-asset-management-main\\web\\src\\app\\api\\agent\\report\\route.ts",
    "c:\\Users\\Asus\\Downloads\\it-asset-management-main\\web\\src\\app\\asset\\[id]\\AssetDetailClient.tsx",
    "c:\\Users\\Asus\\Downloads\\it-asset-management-main\\web\\src\\app\\asset\\[id]\\page.tsx",
    "c:\\Users\\Asus\\Downloads\\it-asset-management-main\\web\\src\\app\\assets\\page.tsx",
    "c:\\Users\\Asus\\Downloads\\it-asset-management-main\\web\\src\\app\\logs\\page.tsx",
    "c:\\Users\\Asus\\Downloads\\it-asset-management-main\\web\\src\\app\\page.tsx",
    "c:\\Users\\Asus\\Downloads\\it-asset-management-main\\web\\src\\app\\settings\\page.tsx",
    "c:\\Users\\Asus\\Downloads\\it-asset-management-main\\web\\src\\lib\\db.ts"
];

filesWithConflicts.forEach(resolveConflictsInFile);
