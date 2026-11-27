// All drawing for Gobble Getaway: one canvas, one logical 1280x720 field,
// every sprite painted from shapes (no image files). The renderer reads the
// world and paints the sky, the parallax farm, the turkey, the farmer, the
// dangers, the pickups, the HUD and the menus — including the title, pause,
// caught and escaped screens the screenshots show.

import { FIELD, TURKEY, PALETTES, COLOURS, FONT, STAGES } from './config.js';
import { stageProgress, stageName, paletteName } from './world.js';

function palette(world) {
  return PALETTES[paletteName(world)];
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSky(ctx, world, pal) {
  const gradient = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  gradient.addColorStop(0, pal.skyTop);
  gradient.addColorStop(0.55, pal.skyMid);
  gradient.addColorStop(1, pal.skyLow);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  // Low autumn sun with a warm glow.
  ctx.fillStyle = pal.sunGlow;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.arc(1050, 130, 86, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = pal.sun;
  ctx.beginPath();
  ctx.arc(1050, 130, 52, 0, Math.PI * 2);
  ctx.fill();
  // Drifting clouds, placed by the clock so the title screen is alive too.
  ctx.fillStyle = 'rgba(255, 244, 220, 0.85)';
  const clouds = [[180, 110, 1], [520, 70, 0.7], [820, 170, 0.85], [1180, 220, 0.6]];
  for (const [cx, cy, scale] of clouds) {
    const drift = (world.time * 12 * scale) % 1400;
    const x = ((cx + drift) % 1400) - 60;
    ctx.beginPath();
    ctx.ellipse(x, cy, 64 * scale, 18 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 40 * scale, cy + 6, 46 * scale, 14 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFarmBackdrop(ctx, world, pal) {
  const scroll = world.distancePx;
  // Far hills.
  ctx.fillStyle = pal.far;
  ctx.beginPath();
  ctx.moveTo(0, FIELD.groundY - 40);
  for (let x = 0; x <= FIELD.width; x += 80) {
    ctx.lineTo(x, FIELD.groundY - 70 - Math.sin((x + scroll * 0.2) / 260) * 34);
  }
  ctx.lineTo(FIELD.width, FIELD.groundY);
  ctx.lineTo(0, FIELD.groundY);
  ctx.closePath();
  ctx.fill();
  // Barns and trees, parallaxed slower than the road.
  for (let i = 0; i < 5; i += 1) {
    const baseX = i * 340 + 60;
    const x = ((baseX - scroll * 0.45) % 1700 + 1700) % 1700 - 200;
    if (i % 2 === 0) {
      // A red barn with a gambrel roof.
      ctx.fillStyle = pal.barn;
      ctx.fillRect(x, FIELD.groundY - 150, 150, 110);
      ctx.fillStyle = pal.barnRoof;
      ctx.beginPath();
      ctx.moveTo(x - 12, FIELD.groundY - 150);
      ctx.lineTo(x + 75, FIELD.groundY - 205);
      ctx.lineTo(x + 162, FIELD.groundY - 150);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff3e0';
      ctx.fillRect(x + 58, FIELD.groundY - 108, 34, 68);
    } else {
      // A round autumn tree.
      ctx.fillStyle = '#5d3a1a';
      ctx.fillRect(x + 40, FIELD.groundY - 130, 18, 90);
      ctx.fillStyle = i % 3 === 0 ? '#c96f2e' : '#d9a441';
      ctx.beginPath();
      ctx.arc(x + 50, FIELD.groundY - 150, 52, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // The ground and the dirt road.
  ctx.fillStyle = pal.ground;
  ctx.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);
  ctx.fillStyle = pal.groundTop;
  ctx.fillRect(0, FIELD.groundY, FIELD.width, 10);
  ctx.fillStyle = pal.grass;
  for (let i = 0; i < 40; i += 1) {
    const x = ((i * 137 - scroll * 1.0) % 1400 + 1400) % 1400 - 60;
    ctx.fillRect(x, FIELD.groundY + 26 + (i % 5) * 12, 14, 3);
  }
  // Fence posts rattling past along the back of the road.
  ctx.fillStyle = pal.fence;
  for (let x = -((scroll * 1.0) % 96); x < FIELD.width + 96; x += 96) {
    ctx.fillRect(x, FIELD.groundY - 44, 8, 44);
    ctx.fillRect(x + 4, FIELD.groundY - 30, 88, 5);
  }
}

function drawTurkey(ctx, x, feetY, runCycle, opts = {}) {
  const { ducking = false, hidden = false, invulnerable = false, facing = 1, big = false } = opts;
  const scale = big ? 2.1 : 1;
  if (invulnerable && Math.floor(runCycle * 14) % 2 === 0) {
    ctx.globalAlpha = 0.45; // Blinking while the turkey cannot be hurt again yet.
  }
  ctx.save();
  ctx.translate(x, feetY);
  ctx.scale(facing * scale, scale);
  const legSwing = Math.sin(runCycle * 2 * Math.PI) * (ducking ? 2 : 10);
  // Legs, mid-stride.
  ctx.strokeStyle = COLOURS.turkeyLeg;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -16);
  ctx.lineTo(-6 + legSwing, 0);
  ctx.moveTo(8, -16);
  ctx.lineTo(8 - legSwing, 0);
  ctx.stroke();
  if (!ducking) {
    // The tail fan: five feathers fanned behind the body.
    for (let i = 0; i < 5; i += 1) {
      const angle = -Math.PI / 2 + (i - 2) * 0.34;
      const featherX = -26 + Math.cos(angle) * 30;
      const featherY = -34 + Math.sin(angle) * 30;
      ctx.fillStyle = COLOURS.turkeyTail[i % COLOURS.turkeyTail.length];
      ctx.beginPath();
      ctx.ellipse(featherX, featherY, 9, 22, angle, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Body and belly.
  ctx.fillStyle = COLOURS.turkeyBody;
  ctx.beginPath();
  ctx.ellipse(0, -30, 34, 24, -0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLOURS.turkeyBelly;
  ctx.beginPath();
  ctx.ellipse(8, -24, 20, 14, -0.1, 0, Math.PI * 2);
  ctx.fill();
  // Wing, flapping a little with the run.
  ctx.fillStyle = '#6e451f';
  ctx.beginPath();
  ctx.ellipse(-4, -30 + Math.sin(runCycle * 2 * Math.PI) * 3, 18, 10, -0.5, 0, Math.PI * 2);
  ctx.fill();
  // Neck, head, beak, wattle and a worried eye.
  const headY = ducking ? -34 : -58;
  ctx.strokeStyle = COLOURS.turkeyHead;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(20, -44);
  ctx.lineTo(26, headY + 8);
  ctx.stroke();
  ctx.fillStyle = COLOURS.turkeyHead;
  ctx.beginPath();
  ctx.arc(28, headY, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLOURS.turkeyBeak;
  ctx.beginPath();
  ctx.moveTo(38, headY - 2);
  ctx.lineTo(52, headY + 3);
  ctx.lineTo(38, headY + 7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLOURS.turkeyWattle;
  ctx.beginPath();
  ctx.ellipse(36, headY + 10, 4, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c1c1c';
  ctx.beginPath();
  ctx.arc(31, headY - 4, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
  if (hidden) return; // Hidden turkeys are drawn by the haystack instead.
}

function drawFarmer(ctx, world) {
  const gap = world.gap;
  const x = TURKEY.x - gap * 2.1 - 30;
  if (x < -140) return;
  const bob = Math.abs(Math.sin(world.time * 9)) * 6;
  const y = FIELD.groundY - bob;
  const throwing = world.farmerState === 'throwing';
  const searching = world.farmerState === 'searching';
  ctx.save();
  ctx.translate(x, y);
  // Legs pumping, overalls and shirt.
  ctx.strokeStyle = COLOURS.farmerOveralls;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  const swing = Math.sin(world.time * 9) * 14;
  ctx.beginPath();
  ctx.moveTo(-4, -46);
  ctx.lineTo(-4 + swing, 0);
  ctx.moveTo(6, -46);
  ctx.lineTo(6 - swing, 0);
  ctx.stroke();
  ctx.fillStyle = COLOURS.farmerShirt;
  roundRect(ctx, -20, -88, 44, 48, 8);
  ctx.fill();
  ctx.fillStyle = COLOURS.farmerOveralls;
  ctx.fillRect(-20, -62, 44, 24);
  // One arm cocked back with a knife when he is about to throw.
  ctx.strokeStyle = COLOURS.farmerSkin;
  ctx.lineWidth = 8;
  ctx.beginPath();
  if (throwing) {
    ctx.moveTo(18, -80);
    ctx.lineTo(40, -108);
  } else {
    ctx.moveTo(18, -80);
    ctx.lineTo(30, -52);
  }
  ctx.stroke();
  if (throwing) {
    ctx.fillStyle = COLOURS.knifeBlade;
    ctx.save();
    ctx.translate(44, -112);
    ctx.rotate(-0.6);
    ctx.fillRect(-4, -22, 8, 34);
    ctx.restore();
  }
  // Head, hat and a very determined moustache.
  ctx.fillStyle = COLOURS.farmerSkin;
  ctx.beginPath();
  ctx.arc(4, -102, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLOURS.farmerHat;
  ctx.fillRect(-14, -116, 38, 7);
  ctx.fillRect(-8, -134, 26, 20);
  ctx.fillStyle = '#5a3a22';
  ctx.beginPath();
  ctx.ellipse(8, -94, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c1c1c';
  ctx.beginPath();
  ctx.arc(9, -105, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (searching) {
    ctx.fillStyle = '#fff3e0';
    ctx.font = `bold 30px ${FONT}`;
    ctx.fillText('?', x + 34, y - 140);
  }
}

function drawObstacle(ctx, obstacle, world) {
  const top = FIELD.groundY - obstacle.h;
  if (obstacle.kind === 'fence') {
    ctx.fillStyle = '#5d3a1a';
    ctx.fillRect(obstacle.x, top, 8, obstacle.h);
    ctx.fillRect(obstacle.x + obstacle.w - 8, top, 8, obstacle.h);
    ctx.fillRect(obstacle.x - 4, top + 8, obstacle.w + 8, 7);
    ctx.fillRect(obstacle.x - 4, top + 30, obstacle.w + 8, 7);
  } else if (obstacle.kind === 'haybale') {
    ctx.fillStyle = '#d9a441';
    ctx.beginPath();
    ctx.arc(obstacle.x + obstacle.w / 2, FIELD.groundY - obstacle.h / 2, obstacle.h / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a67c2e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(obstacle.x + obstacle.w / 2, FIELD.groundY - obstacle.h / 2, obstacle.h / 3, 0, Math.PI * 2);
    ctx.stroke();
  } else if (obstacle.kind === 'haystack') {
    ctx.fillStyle = COLOURS.hay;
    ctx.beginPath();
    ctx.moveTo(obstacle.x, FIELD.groundY);
    ctx.quadraticCurveTo(obstacle.x + obstacle.w / 2, top - 26, obstacle.x + obstacle.w, FIELD.groundY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b8912a';
    ctx.lineWidth = 2;
    for (let i = 1; i < 5; i += 1) {
      const sx = obstacle.x + (obstacle.w * i) / 5;
      ctx.beginPath();
      ctx.moveTo(sx, FIELD.groundY - 8);
      ctx.lineTo(sx + 8, top + 22 + i * 6);
      ctx.stroke();
    }
    if (world.turkey.hidden) {
      // Only the tail feathers poke out while the turkey hides.
      ctx.fillStyle = COLOURS.turkeyTail[1];
      ctx.beginPath();
      ctx.ellipse(obstacle.x + obstacle.w / 2 - 8, top + 4, 8, 16, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff3e0';
      ctx.font = `bold 15px ${FONT}`;
      ctx.fillText('HIDING…', obstacle.x + obstacle.w / 2 - 34, top - 12);
    } else if (!obstacle.quiet) {
      // Staged scenes (the title screen) already explain hiding in words.
      ctx.fillStyle = 'rgba(20, 12, 8, 0.75)';
      roundRect(ctx, obstacle.x + obstacle.w / 2 - 52, top - 34, 104, 24, 12);
      ctx.fill();
      ctx.fillStyle = '#ffd166';
      ctx.font = `bold 14px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('HIDE: HOLD ↓', obstacle.x + obstacle.w / 2, top - 17);
      ctx.textAlign = 'left';
    }
  } else if (obstacle.kind === 'oven') {
    const flame = 0.5 + 0.5 * Math.sin(world.time * 11 + obstacle.flame);
    ctx.fillStyle = COLOURS.ovenBody;
    roundRect(ctx, obstacle.x, top, obstacle.w, obstacle.h, 8);
    ctx.fill();
    ctx.fillStyle = COLOURS.ovenDoor;
    roundRect(ctx, obstacle.x + 12, top + 34, obstacle.w - 24, 52, 6);
    ctx.fill();
    ctx.strokeStyle = '#8a8a96';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(obstacle.x + obstacle.w / 2, top + 60, 12, 0, Math.PI * 2);
    ctx.stroke();
    // Flames licking out of the top and a warning glow.
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = COLOURS.flame[i % 3];
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      const fx = obstacle.x + 22 + i * 26;
      ctx.ellipse(fx, top - 8 - flame * 10, 10, 16 + flame * 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffd166';
    ctx.font = `bold 15px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('HOT OVEN!', obstacle.x + obstacle.w / 2, top - 34);
    ctx.textAlign = 'left';
  } else if (obstacle.kind === 'puddle') {
    ctx.fillStyle = COLOURS.puddle;
    ctx.beginPath();
    ctx.ellipse(obstacle.x + obstacle.w / 2, FIELD.groundY - 4, obstacle.w / 2, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(obstacle.x + obstacle.w / 2 - 14, FIELD.groundY - 6, 18, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawKnife(ctx, knife) {
  ctx.save();
  ctx.translate(knife.x, knife.y);
  ctx.rotate(knife.spin);
  ctx.fillStyle = COLOURS.knifeBlade;
  ctx.beginPath();
  ctx.moveTo(-26, -5);
  ctx.lineTo(14, -5);
  ctx.lineTo(26, 0);
  ctx.lineTo(14, 5);
  ctx.lineTo(-26, 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLOURS.knifeHandle;
  ctx.fillRect(-34, -6, 12, 12);
  ctx.restore();
}

function drawPickup(ctx, pickup, world) {
  const bobY = pickup.y + Math.sin(world.time * 4 + pickup.bob) * 4;
  if (pickup.kind === 'corn') {
    ctx.fillStyle = COLOURS.cornHusk;
    ctx.beginPath();
    ctx.ellipse(pickup.x - 12, bobY + 8, 7, 16, -0.5, 0, Math.PI * 2);
    ctx.ellipse(pickup.x + 12, bobY + 8, 7, 16, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLOURS.corn;
    ctx.beginPath();
    ctx.ellipse(pickup.x, bobY, 11, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d9a441';
    ctx.lineWidth = 1.5;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(pickup.x + i * 5, bobY - 14);
      ctx.lineTo(pickup.x + i * 5, bobY + 14);
      ctx.stroke();
    }
  } else if (pickup.kind === 'feather') {
    ctx.fillStyle = COLOURS.feather;
    ctx.save();
    ctx.translate(pickup.x, bobY);
    ctx.rotate(Math.sin(world.time * 3) * 0.3);
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b8912a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(0, 20);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#fff3e0';
    ctx.font = `bold 13px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('+50', pickup.x, bobY - 30);
    ctx.textAlign = 'left';
  } else if (pickup.kind === 'pie') {
    ctx.fillStyle = COLOURS.pie;
    ctx.beginPath();
    ctx.moveTo(pickup.x - 16, bobY + 10);
    ctx.lineTo(pickup.x + 16, bobY + 10);
    ctx.lineTo(pickup.x, bobY - 16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f4d35e';
    ctx.fillRect(pickup.x - 16, bobY + 8, 32, 5);
    ctx.fillStyle = '#fff3e0';
    ctx.font = `bold 13px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('+1 LIFE', pickup.x, bobY - 24);
    ctx.textAlign = 'left';
  }
}

function drawHud(ctx, world) {
  const pal = palette(world);
  ctx.fillStyle = COLOURS.hudPanel;
  roundRect(ctx, 16, 14, FIELD.width - 32, 64, 14);
  ctx.fill();
  ctx.fillStyle = COLOURS.hudText;
  ctx.font = `bold 26px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${world.score}`, 34, 42);
  ctx.font = `bold 20px ${FONT}`;
  ctx.fillText(`${Math.floor(world.distanceMetres)} m`, 34, 66);
  // Stage progress bar.
  const barX = 300;
  const barW = 300;
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, barX, 30, barW, 14, 7);
  ctx.fill();
  ctx.fillStyle = COLOURS.hudAccent;
  roundRect(ctx, barX, 30, barW * stageProgress(world), 14, 7);
  ctx.fill();
  ctx.fillStyle = COLOURS.hudText;
  ctx.font = `bold 16px ${FONT}`;
  ctx.fillText(stageName(world), barX, 66);
  ctx.font = `bold 15px ${FONT}`;
  ctx.fillText(`STAGE ${world.stageIndex + 1}/3`, barX + barW + 14, 44);
  // Lives as hearts.
  for (let i = 0; i < world.lives; i += 1) {
    const hx = 760 + i * 34;
    ctx.fillStyle = COLOURS.danger;
    ctx.beginPath();
    ctx.arc(hx, 36, 9, 0, Math.PI * 2);
    ctx.arc(hx + 14, 36, 9, 0, Math.PI * 2);
    ctx.moveTo(hx - 2, 42);
    ctx.lineTo(hx + 24, 42);
    ctx.lineTo(hx + 11, 54);
    ctx.closePath();
    ctx.fill();
  }
  // Corn count and the farmer gap meter.
  ctx.fillStyle = COLOURS.corn;
  ctx.beginPath();
  ctx.ellipse(920, 40, 8, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLOURS.hudText;
  ctx.font = `bold 20px ${FONT}`;
  ctx.fillText(`x ${world.corn}`, 936, 47);
  ctx.font = `bold 14px ${FONT}`;
  ctx.fillText('FARMER', 1000, 32);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, 1000, 38, 150, 12, 6);
  ctx.fill();
  ctx.fillStyle = world.gap < 30 ? COLOURS.danger : '#7fb069';
  roundRect(ctx, 1000, 38, 150 * (world.gap / 100), 12, 6);
  ctx.fill();
  ctx.fillStyle = COLOURS.hudText;
  ctx.font = `bold 14px ${FONT}`;
  ctx.fillText(`BEST ${world.best}`, 1000, 66);
  if (world.bannerTime > 0 && world.banner) {
    ctx.globalAlpha = Math.min(1, world.bannerTime);
    ctx.fillStyle = 'rgba(20, 12, 8, 0.55)';
    roundRect(ctx, FIELD.width / 2 - 260, 120, 520, 64, 16);
    ctx.fill();
    ctx.fillStyle = COLOURS.hudAccent;
    ctx.font = `bold 34px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(world.banner, FIELD.width / 2, 162);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
  if (world.phase === 'playing') {
    ctx.fillStyle = 'rgba(255, 243, 224, 0.9)';
    ctx.font = `15px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('SPACE / CLICK jump  •  ↓ duck & hide  •  SHIFT dash  •  P pause  •  M sound', FIELD.width / 2, FIELD.height - 16);
    ctx.textAlign = 'left';
  }
}

function drawTitle(ctx, world) {
  ctx.fillStyle = 'rgba(20, 10, 6, 0.45)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  // A big turkey front and centre, with the farmer sneaking in behind.
  drawTurkey(ctx, 330, 480, world.time, { big: true });
  drawFarmer(ctx, { ...world, gap: 96, time: world.time, farmerState: 'chasing', farmerStateTime: 0 });
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd166';
  ctx.font = `bold 92px ${FONT}`;
  ctx.fillText('GOBBLE', FIELD.width / 2 + 120, 210);
  ctx.fillText('GETAWAY', FIELD.width / 2 + 120, 300);
  ctx.fillStyle = '#fff3e0';
  ctx.font = `bold 26px ${FONT}`;
  ctx.fillText('The Great Thanksgiving Escape', FIELD.width / 2 + 120, 348);
  ctx.font = `20px ${FONT}`;
  ctx.fillText('Thanksgiving is coming. The farmer is coming faster.', FIELD.width / 2 + 120, 386);
  ctx.fillText('Run the barnyard, the cornfield and the kitchen — and do not end up dinner.', FIELD.width / 2 + 120, 416);
  ctx.fillStyle = '#ffd166';
  ctx.font = `bold 22px ${FONT}`;
  ctx.fillText('SPACE / ↑ / CLICK — jump      ↓ — duck & hide in haystacks      SHIFT — dash', FIELD.width / 2, 500);
  ctx.fillText('Dodge fences, ovens and the carving knife. Grab corn, feathers and pie.', FIELD.width / 2, 534);
  const blink = 0.6 + 0.4 * Math.sin(world.time * 4);
  ctx.globalAlpha = blink;
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 30px ${FONT}`;
  ctx.fillText('PRESS ENTER OR CLICK TO START', FIELD.width / 2, 596);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#fff3e0';
  ctx.font = `18px ${FONT}`;
  ctx.fillText(`BEST SCORE  ${world.best}`, FIELD.width / 2, 640);
  ctx.fillText('3 stages  •  3 lives  •  hide, dash, gobble', FIELD.width / 2, 668);
  ctx.textAlign = 'left';
}

function drawEndScreen(ctx, world, escaped) {
  ctx.fillStyle = escaped ? 'rgba(30, 80, 30, 0.55)' : 'rgba(60, 10, 6, 0.6)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = escaped ? '#a7f3a7' : '#ff8a7a';
  ctx.font = `bold 84px ${FONT}`;
  ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', FIELD.width / 2, 250);
  ctx.fillStyle = '#fff3e0';
  ctx.font = `24px ${FONT}`;
  if (escaped) {
    ctx.fillText('The turkey made it past the kitchen, over the fence and into the woods.', FIELD.width / 2, 306);
    ctx.fillText('No Thanksgiving dinner this year. Gobble gobble — freedom tastes better.', FIELD.width / 2, 340);
  } else if (world.caughtReason === 'grabbed') {
    ctx.fillText('The farmer closed the gap and grabbed the turkey by the tail feathers.', FIELD.width / 2, 306);
    ctx.fillText('So close — and yet so very much Thanksgiving dinner.', FIELD.width / 2, 340);
  } else {
    ctx.fillText('Three hits too many — the farmer has the turkey, and the oven is preheating.', FIELD.width / 2, 306);
    ctx.fillText('The carving knife never even had to leave the drawer.', FIELD.width / 2, 340);
  }
  ctx.font = `bold 34px ${FONT}`;
  ctx.fillStyle = '#ffd166';
  ctx.fillText(`SCORE  ${world.score}     •     DISTANCE  ${Math.floor(world.distanceMetres)} m     •     CORN  ${world.corn}`, FIELD.width / 2, 420);
  ctx.fillStyle = '#fff3e0';
  ctx.font = `22px ${FONT}`;
  ctx.fillText(`BEST  ${world.best}${world.newBest ? '  —  NEW BEST!' : ''}`, FIELD.width / 2, 462);
  if (escaped) {
    // Confetti for the free bird.
    for (let i = 0; i < 60; i += 1) {
      const cx = (i * 197 + world.time * 60) % FIELD.width;
      const cy = (i * 131 + world.time * 140) % 300 + 40;
      ctx.fillStyle = COLOURS.turkeyTail[i % 4];
      ctx.fillRect(cx, cy, 8, 12);
    }
  }
  const blink = 0.6 + 0.4 * Math.sin(world.time * 4);
  ctx.globalAlpha = blink;
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 28px ${FONT}`;
  ctx.fillText('PRESS R OR ENTER TO RUN AGAIN', FIELD.width / 2, 540);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

function drawPaused(ctx, world) {
  ctx.fillStyle = 'rgba(20, 10, 6, 0.6)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff3e0';
  ctx.font = `bold 64px ${FONT}`;
  ctx.fillText('PAUSED', FIELD.width / 2, 320);
  ctx.font = `22px ${FONT}`;
  ctx.fillText('The farmer waits. He is patient. He has a pie cooling on the sill.', FIELD.width / 2, 372);
  ctx.fillText('P to resume  •  R to restart  •  M to toggle sound', FIELD.width / 2, 410);
  ctx.textAlign = 'left';
}

export function renderWorld(ctx, world) {
  const pal = palette(world);
  ctx.save();
  if (world.shake > 0) {
    ctx.translate((Math.random() - 0.5) * world.shake * 22, (Math.random() - 0.5) * world.shake * 22);
  }
  drawSky(ctx, world, pal);
  drawFarmBackdrop(ctx, world, pal);
  for (const obstacle of world.obstacles) drawObstacle(ctx, obstacle, world);
  for (const pickup of world.pickups) {
    if (!pickup.taken) drawPickup(ctx, pickup, world);
  }
  for (const knife of world.knives) drawKnife(ctx, knife);
  // The turkey is drawn inside its haystack while hidden, and the title
  // screen draws its own big turkey, so the running one stays out of it.
  if (!world.turkey.hidden && world.phase !== 'title') {
    drawTurkey(ctx, TURKEY.x, world.turkey.y, world.turkey.runCycle, {
      ducking: world.turkey.ducking,
      invulnerable: world.turkey.invulnerable > 0,
    });
  }
  drawFarmer(ctx, world);
  if (world.phase !== 'title') drawHud(ctx, world);
  if (world.phase === 'title') drawTitle(ctx, world);
  if (world.phase === 'paused') drawPaused(ctx, world);
  if (world.phase === 'caught') drawEndScreen(ctx, world, false);
  if (world.phase === 'escaped') drawEndScreen(ctx, world, true);
  // A red flash at the edges when the turkey has just been hit.
  if (world.turkey.invulnerable > 1.2 && world.phase === 'playing') {
    ctx.fillStyle = 'rgba(255, 60, 40, 0.18)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }
  ctx.restore();
}

export { STAGES };
