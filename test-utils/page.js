const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
module.exports = function installPage() {
    document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML;
};
