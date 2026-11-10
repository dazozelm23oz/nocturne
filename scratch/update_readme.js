const fs = require('fs');
let content = fs.readFileSync('docs/README.md', 'utf8');

const target = '| [**Single-Instance Guard & Redesigned Sign-In**](./reports/single_instance_and_redesigned_signin.md)';
const replacement = `| [**Settings Modal Theme Matching Suite**](./reports/settings_theme_matching_report.md) | Dynamic synchronization of the settings modal background, active category tabs, segment buttons, dropdowns, toggles, and sliders with Auto (Album Palette), Dark (#121214), and Light (Apple Music iOS 18) themes. |
| [**Single-Instance Guard & Redesigned Sign-In**](./reports/single_instance_and_redesigned_signin.md)`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('docs/README.md', content, 'utf8');
  console.log('Successfully added Settings Modal Theme Matching Suite to docs/README.md!');
} else {
  console.log('Target string not found in docs/README.md');
}
