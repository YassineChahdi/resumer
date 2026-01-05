// HTML Component Generators

export function itemHtml(type, idx, fields, hasBullets = false, bullets = [], canDelete = true) {
    const label = { edu: 'Education', exp: 'Experience', proj: 'Project' }[type];
    const removeBtn = canDelete ? `<button class="btn-remove" onclick="removeItem('${type}',${idx})"><span class="material-symbols-outlined">delete</span></button>` : '';
    let html = `<div class="list-item" data-type="${type}" data-idx="${idx}">
        <div class="list-item-header"><span>${label} #${idx + 1}</span>${removeBtn}</div>
        <div class="row">${fields.slice(0, 2).map(f => fieldInput(f)).join('')}</div>
        <div class="row">${fields.slice(2, 4).map(f => fieldInput(f)).join('')}</div>
        ${fields[4] ? fieldInput(fields[4]) : ''}`;
    if (hasBullets) {
        const bulletCount = bullets.length || 1;
        html += `<div class="bullets" data-type="${type}" data-idx="${idx}">
            ${bullets.length ? bullets.map((b, bi) => bulletHtml(type, idx, bi, b, bulletCount > 1)).join('') : bulletHtml(type, idx, 0, {}, false)}
        </div><button class="btn-add-bullet" onclick="addBullet('${type}',${idx})"><span class="material-symbols-outlined">add</span> Bullet</button>`;
    }
    return html + '</div>';
}

export function fieldInput(f) {
    if (f.isGpa) {
        return `<input type="text" inputmode="decimal" placeholder="${f.ph}" data-field="${f.field}" value="${f.val || ''}" oninput="this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\\..*)\\./g, '$1')" onchange="clampGpa(this)"/>`;
    }
    return `<input type="${f.type || 'text'}" placeholder="${f.ph}" data-field="${f.field}" value="${f.val || ''}" ${f.step ? 'step="' + f.step + '"' : ''}/>`;
}

export function bulletHtml(type, idx, bi, b = {}, canDelete = true) {
    const removeBtn = canDelete ? `<button class="btn-remove" onclick="removeBullet('${type}',${idx},${bi})"><span class="material-symbols-outlined">close</span></button>` : '';
    return `<div class="bullet-row">
        <input type="text" placeholder="Bullet" data-field="text" value="${b.text || ''}"/>
        <span class="tooltip tooltip-align-right"><input type="text" inputmode="decimal" placeholder="Imp" data-field="impressiveness" value="${b.impressiveness ?? ''}" oninput="this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\\..*)\\./g, '$1')" onchange="clampImpressiveness(this)" style="margin-bottom:0;"/><span class="tooltip-text">Impressiveness, in [0, 1]</span></span>
        ${removeBtn}
    </div>`;
}

export function certItemHtml(idx, c = {}, canDelete = true) {
    const removeBtn = canDelete ? `<button class="btn-remove" onclick="removeItem('cert',${idx})"><span class="material-symbols-outlined">delete</span></button>` : '';
    return `<div class="list-item cert-item" data-type="cert" data-idx="${idx}">
        <div class="list-item-header"><span>Certification #${idx + 1}</span>${removeBtn}</div>
        <div class="row">
            <input type="text" placeholder="Certification Name" data-field="name" value="${c.name || ''}"/>
            <input type="text" placeholder="Issuer" data-field="issuer" value="${c.issuer || ''}"/>
        </div>
        <div class="row">
            <input type="text" placeholder="Date (e.g. Jan 2024)" data-field="date" value="${c.date || ''}"/>
            <div></div>
        </div>
    </div>`;
}

export function volItemHtml(idx, v = {}, canDelete = true) {
    const removeBtn = canDelete ? `<button class="btn-remove" onclick="removeItem('vol',${idx})"><span class="material-symbols-outlined">delete</span></button>` : '';
    const bullets = v.bullets || [];
    const bulletCount = bullets.length || 1;
    return `<div class="list-item vol-item" data-type="vol" data-idx="${idx}">
        <div class="list-item-header"><span>Volunteer #${idx + 1}</span>${removeBtn}</div>
        <div class="row">
            <input type="text" placeholder="Organization" data-field="organization" value="${v.organization || ''}"/>
            <input type="text" placeholder="Location" data-field="location" value="${v.location || ''}"/>
        </div>
        <div class="row">
            <input type="text" placeholder="Role / Title" data-field="title" value="${v.title || ''}"/>
            <input type="text" placeholder="Duration" data-field="duration" value="${v.duration || ''}"/>
        </div>
        <div class="bullets" data-type="vol" data-idx="${idx}">
            ${bullets.length ? bullets.map((b, bi) => bulletHtml('vol', idx, bi, b, bulletCount > 1)).join('') : bulletHtml('vol', idx, 0, {}, false)}
        </div>
        <button class="btn-add-bullet" onclick="addBullet('vol',${idx})"><span class="material-symbols-outlined">add</span> Bullet</button>
    </div>`;
}

// Helper structure generators
export function eduFields(e = {}) {
    return [
        { ph: 'Institution', field: 'est_name', val: e.est_name },
        { ph: 'Location', field: 'location', val: e.location },
        { ph: 'Degree', field: 'degree', val: e.degree },
        { ph: 'Year', field: 'year', val: e.year },
        { ph: 'GPA', field: 'gpa', val: e.gpa, isGpa: true }
    ];
}

export function expFields(e = {}) {
    return [
        { ph: 'Employer', field: 'employer', val: e.employer },
        { ph: 'Location', field: 'location', val: e.location },
        { ph: 'Title', field: 'title', val: e.title },
        { ph: 'Duration', field: 'duration', val: e.duration }
    ];
}

export function projFields(p = {}) {
    return [
        { ph: 'Title', field: 'title', val: p.title },
        { ph: 'Languages', field: 'languages', val: p.languages }
    ];
}
