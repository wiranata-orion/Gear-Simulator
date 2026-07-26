// 1. Setup Canvas Responsif
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// 2. State Mesin Utama & Rantai Compound Gear
let inputRPM = 13;
let inputTorque = 1000;
const scale = 2.0;
const g = 9.81;
const gearMassStandard = 0.5; // Masa standar 1 gear = 0.5 kg

let stages = [
  { id: 1, drivenTeeth: 12, driverTeeth: 48, x: 0, y: 0, angle: 0, speed: 0, torque: 0 },
  { id: 2, drivenTeeth: 12, driverTeeth: 48, x: 0, y: 0, angle: 0, speed: 0, torque: 0 },
  { id: 3, drivenTeeth: 12, driverTeeth: 48, x: 0, y: 0, angle: 0, speed: 0, torque: 0 },
  { id: 4, drivenTeeth: 12, driverTeeth: 48, x: 0, y: 0, angle: 0, speed: 0, torque: 0 }
];

// 3. UI Control Panel
const uiContainer = document.createElement('div');
uiContainer.style.position = 'fixed';
uiContainer.style.top = '10px';
uiContainer.style.left = '10px';
uiContainer.style.zIndex = '9999';
uiContainer.style.background = '#1e293b';
uiContainer.style.border = '2px solid #38bdf8';
uiContainer.style.borderRadius = '8px';
uiContainer.style.padding = '10px';
uiContainer.style.color = '#ffffff';
uiContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
document.body.appendChild(uiContainer);

function updateUI() {
  let html = `
    <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px; border-bottom: 1px solid #334155; padding-bottom: 8px;">
      <b style="color: #38bdf8;">INPUT MESIN:</b>
      RPM: <input type="number" id="rpmInp" value="${inputRPM}" style="width: 50px;">
      Nm: <input type="number" id="trqInp" value="${inputTorque}" style="width: 55px;">
      
      <div style="margin-left: 15px;">
        <button id="addBtn" style="background: #22c55e; color: black; font-weight: bold; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">+ TAMBAH POROS</button>
        <button id="remBtn" style="background: #ef4444; color: white; font-weight: bold; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">- HAPUS POROS</button>
      </div>
    </div>

    <div style="display: flex; gap: 8px; overflow-x: auto; max-width: 85vw; padding-bottom: 4px;">
  `;

  stages.forEach((stg, idx) => {
    html += `
      <div style="background: #334155; padding: 6px 10px; border-radius: 6px; text-align: center; flex-shrink: 0; border: 1px solid #475569;">
        <b style="color: #38bdf8;">Poros ${stg.id}</b><br>
        <div style="margin-top: 4px; font-size: 11px;">
          In: <input type="number" data-idx="${idx}" class="driven-inp" value="${stg.drivenTeeth}" min="6" max="100" style="width: 40px;"> T<br>
          Out: <input type="number" data-idx="${idx}" class="driver-inp" value="${stg.driverTeeth}" min="6" max="100" style="width: 40px;"> T
        </div>
      </div>
    `;
  });

  html += `</div>`;
  uiContainer.innerHTML = html;

  document.getElementById('rpmInp').addEventListener('change', (e) => inputRPM = Math.max(1, parseFloat(e.target.value) || 1));
  document.getElementById('trqInp').addEventListener('change', (e) => inputTorque = Math.max(1, parseFloat(e.target.value) || 1));

  document.getElementById('addBtn').onclick = () => {
    stages.push({ id: stages.length + 1, drivenTeeth: 12, driverTeeth: 48, x: 0, y: 0, angle: 0, speed: 0, torque: 0 });
    updateUI();
  };

  document.getElementById('remBtn').onclick = () => {
    if (stages.length > 1) {
      stages.pop();
      updateUI();
    }
  };

  document.querySelectorAll('.driven-inp').forEach(inp => {
    inp.addEventListener('change', (e) => {
      const idx = parseInt(e.target.getAttribute('data-idx'));
      stages[idx].drivenTeeth = Math.max(6, parseInt(e.target.value) || 6);
    });
  });

  document.querySelectorAll('.driver-inp').forEach(inp => {
    inp.addEventListener('change', (e) => {
      const idx = parseInt(e.target.getAttribute('data-idx'));
      stages[idx].driverTeeth = Math.max(6, parseInt(e.target.value) || 6);
    });
  });
}

updateUI();

// 4. Update Fisika & Posisi
function updatePhysics() {
  let startX = 80;
  const startY = window.innerHeight / 2 + 50;

  for (let i = 0; i < stages.length; i++) {
    const stg = stages[i];
    stg.y = startY;

    if (i === 0) {
      const maxRadius = Math.max(stg.driverTeeth, stg.drivenTeeth) * scale;
      stg.x = startX + maxRadius;
    } else {
      const prev = stages[i - 1];
      startX = prev.x + (prev.driverTeeth * scale) + (stg.drivenTeeth * scale);
      stg.x = startX;
    }
  }

  stages[0].speed = inputRPM;
  stages[0].torque = inputTorque;

  for (let i = 1; i < stages.length; i++) {
    const prev = stages[i - 1];
    const curr = stages[i];

    const ratio = prev.driverTeeth / curr.drivenTeeth;
    curr.speed = -prev.speed * ratio;
    curr.torque = prev.torque / ratio;
  }
}

// 5. Evaluator Fenomena Fisika Berdasarkan Skala Detail
function getPhysicsPhenomenon(rpm, centrifugalForce, linearVelKMH) {
  const absRPM = Math.abs(rpm);
  const cKMH = 1079252848; // Kecepatan Cahaya (1.079 Miliar km/h)

  if (absRPM >= 1e45) {
    return {
      title: '🌌 KIAMAT KOSMIS (PLANCK LIMIT)',
      color: '#6366f1',
      desc: 'Frekuensi putar menembus Waktu Planck. Hukum fisika runtuh & seluruh energi alam semesta terserap!'
    };
  } else if (linearVelKMH >= cKMH) {
    return {
      title: '🕳️ SINGULARITAS / KERR BLACK HOLE',
      color: '#a855f7',
      desc: 'Densitas energi kinetik meruntuhkan ruang-waktu. Gear berubah menjadi Lubang Hitam yang memutar ergospere!'
    };
  } else if (linearVelKMH >= cKMH * 0.1) {
    return {
      title: '⚛️ BATAS RELATIVITAS EINSTEIN',
      color: '#ec4899',
      desc: 'Mendekati kecepatan cahaya! Massa gear membengkak menuju tak hingga & waktu di materi melambat.'
    };
  } else if (absRPM >= 1e6 || centrifugalForce >= 1e9) {
    return {
      title: '🌟 PLASMA TERMONUKLIR',
      color: '#f43f5e',
      desc: 'Gesekan atomik memicu panas >10 Juta °C. Materi baja meleleh & terionisasi menjadi plasma bintang!'
    };
  } else if (centrifugalForce >= 10000000 || absRPM >= 100000) {
    return {
      title: '💥 MELEDAK (FLYEXPLOSION)',
      color: '#ef4444',
      desc: 'Gaya sentrifugal melampaui batas tarik baja (>800 MPa). Gear hancur meledak jadi proyektil supersonik!'
    };
  } else if (absRPM >= 10000 || linearVelKMH >= 1235) {
    return {
      title: '🔊 SONIC BOOM (SUPERSONIC)',
      color: '#f97316',
      desc: 'Ujung gigi menembus kecepatan suara (>1.235 km/h). Muncul gelombang kejut & suara dentuman!'
    };
  } else if (absRPM >= 1000) {
    return {
      title: '🔥 OVERHEATING & VIBRASI',
      color: '#eab308',
      desc: 'Gesekan tinggi. Pelumas menguap, komponen memanas mendidih & resonansi getaran meningkat.'
    };
  } else {
    return {
      title: '🟢 OPERASIONAL AMAN',
      color: '#22c55e',
      desc: 'Putaran stabil & aman. Beban tegangan mekanis berada di dalam batas elastisitas bahan.'
    };
  }
}

// 6. Render Gear & Status per Poros
function drawStage(stg) {
  ctx.save();
  ctx.translate(stg.x, stg.y);
  ctx.rotate(stg.angle);

  const driverRadius = stg.driverTeeth * scale;
  const drivenRadius = stg.drivenTeeth * scale;

  // Driver (Output Gear)
  ctx.beginPath();
  ctx.arc(0, 0, driverRadius, 0, Math.PI * 2);
  const speedRatio = Math.min(Math.abs(stg.speed) / 2000, 1);
  ctx.fillStyle = `rgb(${Math.floor(255 * speedRatio)}, 80, ${Math.floor(220 * (1 - speedRatio))})`;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  for (let i = 0; i < stg.driverTeeth; i++) {
    const a = (i / stg.driverTeeth) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * (driverRadius + 3), Math.sin(a) * (driverRadius + 3), 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  // Driven (Input Gear)
  ctx.beginPath();
  ctx.arc(0, 0, drivenRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  for (let i = 0; i < stg.drivenTeeth; i++) {
    const a = (i / stg.drivenTeeth) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * (drivenRadius + 3), Math.sin(a) * (drivenRadius + 3), 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  // Indikator Poros
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.max(driverRadius, drivenRadius) - 2, 0);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.restore();

  // Text Info & Lencana Mini
  const maxR = Math.max(driverRadius, drivenRadius);
  const radSec = (Math.abs(stg.speed) * 2 * Math.PI) / 60;
  const radiusMeters = (stg.driverTeeth * 0.005);
  const cForce = gearMassStandard * Math.pow(radSec, 2) * radiusMeters;
  const linearKMH = (radSec * radiusMeters) * 3.6;
  const phenomenon = getPhysicsPhenomenon(stg.speed, cForce, linearKMH);

  ctx.fillStyle = '#ffffff';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Poros ${stg.id}`, stg.x, stg.y - maxR - 25);
  
  // Lencana Fenomena Mini
  ctx.fillStyle = phenomenon.color;
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(phenomenon.title.split(' ')[0] + ' ' + phenomenon.title.split(' ')[1], stg.x, stg.y - maxR - 10);

  ctx.fillStyle = '#ffffff';
  ctx.font = '11px monospace';
  ctx.fillText(`${stg.speed.toFixed(1)} RPM`, stg.x, stg.y + maxR + 18);
  ctx.fillText(`${stg.torque.toFixed(2)} Nm`, stg.x, stg.y + maxR + 32);
}

// 7. Loop Animasi Utama
let lastTime = performance.now();

function animate(currentTime) {
  const dt = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  updatePhysics();

  stages.forEach(stg => {
    stg.angle += ((stg.speed * 2 * Math.PI) / 60) * dt;
    drawStage(stg);
  });

  // --- DASHBOARD ANALISIS FENOMENA POROS TERAKHIR ---
  const last = stages[stages.length - 1];
  const absRPM = Math.abs(last.speed);
  const radSec = (absRPM * 2 * Math.PI) / 60;
  const radiusMeters = (last.driverTeeth * 0.005);

  const linearVelKMH = (radSec * radiusMeters) * 3.6;
  const centrifugalForce = gearMassStandard * Math.pow(radSec, 2) * radiusMeters;
  const phenomenon = getPhysicsPhenomenon(last.speed, centrifugalForce, linearVelKMH);

  const boxWidth = 390;
  const boxHeight = 200;
  const boxX = canvas.width - boxWidth - 20;
  const boxY = canvas.height - boxHeight - 20;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.strokeStyle = phenomenon.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = phenomenon.color;
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`⚠️ STATUS FENOMENA: ${phenomenon.title}`, boxX + 15, boxY + 28);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px sans-serif';
  ctx.fillText(phenomenon.desc, boxX + 15, boxY + 48, boxWidth - 30);

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(boxX + 15, boxY + 62);
  ctx.lineTo(boxX + boxWidth - 15, boxY + 62);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '12px monospace';
  ctx.fillText(` Output Kecepatan : ${absRPM.toLocaleString(undefined, {maximumFractionDigits: 1})} RPM`, boxX + 15, boxY + 84);
  ctx.fillText(` Output Torsi     : ${last.torque.toFixed(6)} Nm`, boxX + 15, boxY + 104);
  ctx.fillText(` Kecepatan Tangensial: ${linearVelKMH.toLocaleString(undefined, {maximumFractionDigits: 1})} km/h`, boxX + 15, boxY + 124);
  ctx.fillText(` Gaya Sentrifugal : ${centrifugalForce.toLocaleString(undefined, {maximumFractionDigits: 0})} N`, boxX + 15, boxY + 144);

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate); 