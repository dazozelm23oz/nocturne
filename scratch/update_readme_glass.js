const fs = require('fs');
let content = fs.readFileSync('docs/README.md', 'utf8');

const target = '| [**Settings Modal Theme Matching Suite**](./reports/settings_theme_matching_report.md)';
const replacement = `| [**Settings Modal Equal Distancing & Frosted Glass Suite**](./reports/category_tabs_and_glass_translucency_report.md) | 5-column equal CSS Grid layout, boundary containment & responsive labels for Playback & System, translucent frosted glass backdrop blur, and editable blur/opacity sliders in Appearance. |
| [**Settings Modal Theme Matching Suite**](./reports/settings_theme_matching_report.md)`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('docs/README.md', content, 'utf8');
  console.log('Successfully updated docs/README.md with new report!');
} else {
  console.log('Target not found in docs/README.md');
}
