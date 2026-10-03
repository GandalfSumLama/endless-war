'use strict';

window.runSmokeChecks = async ({ resources = false } = {}) => {
  const errors = [], warnings = [];
  const check = (ok, message, bucket = errors) => { if (!ok) bucket.push(message); };
  const ids = new Set();

  for (const [id, weapon] of Object.entries(WEAPONS)) {
    check(!ids.has(id), `Duplicate weapon id: ${id}`);
    ids.add(id);
    check(!!WB[weapon.type], `${id}: missing weapon behavior ${weapon.type}`);
    check(Array.isArray(weapon.ups), `${id}: missing upgrade list`, warnings);
  }
  for (const [id, evo] of Object.entries(EVOLUTIONS)) {
    check(!!WEAPONS[evo.from], `${id}: missing source weapon ${evo.from}`);
    check(!!(WEAPONS[evo.with] || PASSIVES[evo.with]), `${id}: missing recipe item ${evo.with}`);
    check(!!WB[evo.type], `${id}: missing weapon behavior ${evo.type}`);
    check(!!evo.base, `${id}: missing base stats`);
  }
  for (const [id, passive] of Object.entries(PASSIVES))
    check(Number.isInteger(passive.max) && passive.max > 0, `${id}: invalid max level`);
  for (const [id, art] of Object.entries(ART)) {
    if (!art.anims) continue;
    for (const [name, anim] of Object.entries(art.anims)) {
      check(Number.isInteger(anim.row) && anim.row >= 0, `${id}.${name}: invalid row`);
      check(Number.isInteger(anim.n) && anim.n > 0, `${id}.${name}: invalid frame count`);
      check(Number.isFinite(anim.fps) && anim.fps > 0, `${id}.${name}: invalid fps`);
      check(Number.isFinite(art.cw) && art.cw > 0 && Number.isFinite(art.ch) && art.ch > 0, `${id}.${name}: invalid frame size`);
    }
  }
  for (const stage of STAGES) {
    check(!!ENEMIES[stage.boss.type], `${stage.id}: missing boss type ${stage.boss.type}`);
    for (const wave of stage.waves) for (const type of wave.types)
      check(!!ENEMIES[type], `${stage.id}: missing wave enemy ${type}`);
  }

  if (resources) {
    const paths = [...new Set(Object.values(ART).map(a => a.file).filter(Boolean))];
    const results = await Promise.all(paths.map(async path => {
      try {
        const res = await fetch(path, { method: 'HEAD', cache: 'no-store' });
        if (!res.ok) errors.push(`Missing resource (${res.status}): ${path}`);
      } catch (e) { errors.push(`Resource check failed: ${path} (${e.message})`); }
    }));
  }

  const result = { ok: errors.length === 0, errors, warnings, checkedResources: resources ? [...new Set(Object.values(ART).map(a => a.file).filter(Boolean))].length : 0 };
  console.group(`Endless War smoke checks: ${result.ok ? 'PASS' : 'FAIL'}`);
  console.log(result);
  console.groupEnd();
  return result;
};
