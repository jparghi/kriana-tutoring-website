"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { SectionHeading } from "./section-heading";

const SCENE_MS = 7000;

const ANIM_CSS = `
  @keyframes sciFadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  @keyframes sciFadeIn  { from { opacity:0; } to { opacity:1; } }
  @keyframes sciQBounce { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); } }
  @keyframes sciConveyor { from { transform:translateX(0); } to { transform:translateX(-120px); } }
  @keyframes sciCardFall { 0% { transform:translateY(-30px); opacity:0; } 15% { opacity:1; } 80% { opacity:1; } 100% { transform:translateY(130px); opacity:0; } }
  @keyframes sciIconLight { 0% { opacity:0.1; transform:scale(0.6); } 65% { transform:scale(1.15); } 100% { opacity:1; transform:scale(1); } }
  @keyframes sciGlowPulse { 0%,100% { opacity:0.5; transform:scale(1); } 50% { opacity:1; transform:scale(1.08); } }
  @keyframes sciPathTrace { from { stroke-dashoffset:400; } to { stroke-dashoffset:0; } }
  @keyframes sciProgressFill { from { width:0%; } to { width:82%; } }
  @keyframes sciSlideRight { from { transform:translateX(70px); opacity:0; } to { transform:translateX(0); opacity:1; } }
  @keyframes sciStarBurst { 0% { transform:scale(0) rotate(-20deg); opacity:0; } 60% { transform:scale(1.35) rotate(10deg); opacity:1; } 100% { transform:scale(1) rotate(0); opacity:1; } }
  @keyframes sciScaleIn { 0% { transform:scale(0); opacity:0; } 70% { transform:scale(1.1); opacity:1; } 100% { transform:scale(1); opacity:1; } }
  @keyframes sciColorPop { from { filter:saturate(0) brightness(0.7); } to { filter:saturate(1) brightness(1); } }
  @keyframes sciSkyline { from { opacity:0; transform:translateY(14px); } to { opacity:0.18; transform:translateY(0); } }
  @keyframes sciTypeIn { from { opacity:0; letter-spacing:0.25em; } to { opacity:1; letter-spacing:normal; } }
  @keyframes sciCtaPulse { 0%,100% { box-shadow:0 0 0 0 rgba(74,144,226,0.55); } 55% { box-shadow:0 0 0 16px rgba(74,144,226,0); } }
  @keyframes sciBadgePop { 0% { transform:scale(0); } 65% { transform:scale(1.3); } 100% { transform:scale(1); } }
`;

/* ─────────── scene metadata ─────────── */
const SCENES = [
  {
    id:"01", duration:"0–10s",
    title:"Every Child Learns Differently",
    onScreen:"Every Child Learns Differently.",
    voiceover:"Every child is different. They think differently. They learn differently. They grow differently.",
    accent:"#4A90E2",
  },
  {
    id:"02", duration:"10–25s",
    title:"The Problem with One-Size-Fits-All",
    onScreen:"One plan. One worksheet. One result.",
    voiceover:"When every child gets the same plan, most children fall behind. Not because they can't learn — but because no one built a plan around how they learn.",
    accent:"#64748b",
  },
  {
    id:"03", duration:"25–40s",
    title:"The Kriana Assessment",
    onScreen:"Step 1: Assessment — Know Before You Plan",
    voiceover:"At Kriana, we start by getting to know your child. Before a single lesson, we run a thorough assessment — to understand exactly where they are and how they learn best.",
    accent:"#FFD166",
  },
  {
    id:"04", duration:"40–55s",
    title:"The Personalized Learning Plan",
    onScreen:"Step 2: Your Child's Personalized Learning Plan",
    voiceover:"Then we build a plan made for your child — not for every child. A path that starts where they are and takes them where they need to go.",
    accent:"#00B8A9",
  },
  {
    id:"05", duration:"55–70s",
    title:"Monthly Progress & Parent Updates",
    onScreen:"Monthly Progress Reviews · Parent Updates Included",
    voiceover:"Every month, we review your child's progress. And you're always kept in the loop — because when parents and tutors work together, children thrive.",
    accent:"#4A90E2",
  },
  {
    id:"06", duration:"70–82s",
    title:"Confidence & Academic Growth",
    onScreen:"Confident Learners. Real Results.",
    voiceover:"The result? Children who believe in themselves. Who walk into class ready. Who stop saying 'I can't' and start saying 'I've got this.'",
    accent:"#FFD166",
  },
  {
    id:"07", duration:"82–90s",
    title:"Personalized Learning For Every Child",
    onScreen:"Kriana Tutoring · Personalized Learning For Every Child",
    voiceover:"Kriana Tutoring. Personalized Learning For Every Child. Book your free assessment today — and let's build a plan around your child.",
    accent:"#4A90E2",
  },
];

/* ─────────── scene illustrations ─────────── */

function S1() {
  return (
    <svg viewBox="0 0 360 200" className="w-full h-full" aria-hidden>
      {/* desk */}
      <rect x="20" y="148" width="320" height="11" rx="3" fill="#334155"/>
      <rect x="44" y="159" width="7" height="26" rx="2" fill="#2d3748"/>
      <rect x="309" y="159" width="7" height="26" rx="2" fill="#2d3748"/>

      {/* child 1 – teal / confident */}
      <g style={{animation:"sciFadeUp .55s ease .1s both"}}>
        <circle cx="80" cy="102" r="19" fill="#00B8A9"/>
        <circle cx="75" cy="99" r="2.5" fill="white" opacity=".9"/>
        <circle cx="85" cy="99" r="2.5" fill="white" opacity=".9"/>
        <path d="M75 109 Q80 114 85 109" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        <rect x="64" y="122" width="32" height="27" rx="4" fill="#00B8A9" opacity=".75"/>
        <rect x="52" y="140" width="56" height="9" rx="2" fill="#0f2a20"/>
        <path d="M58 144 L64 149 L72 141" stroke="#00B8A9" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </g>

      {/* child 2 – amber / confused */}
      <g style={{animation:"sciFadeUp .55s ease .35s both"}}>
        <circle cx="180" cy="98" r="19" fill="#FFD166"/>
        <circle cx="175" cy="95" r="2.5" fill="#78350f" opacity=".85"/>
        <circle cx="185" cy="95" r="2.5" fill="#78350f" opacity=".85"/>
        <path d="M175 107 Q180 104 185 107" stroke="#78350f" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        <rect x="164" y="118" width="32" height="27" rx="4" fill="#FFD166" opacity=".75"/>
        <rect x="152" y="140" width="56" height="9" rx="2" fill="#1e1a0a"/>
        <line x1="158" y1="144" x2="198" y2="144" stroke="#475569" strokeWidth="1.5" opacity=".5"/>
      </g>

      {/* child 3 – rose / staring away */}
      <g style={{animation:"sciFadeUp .55s ease .6s both"}}>
        <circle cx="280" cy="104" r="19" fill="#FF8A65"/>
        <circle cx="275" cy="101" r="2.5" fill="#7c2d12" opacity=".85"/>
        <circle cx="285" cy="101" r="2.5" fill="#7c2d12" opacity=".85"/>
        <line x1="275" y1="111" x2="285" y2="111" stroke="#7c2d12" strokeWidth="2" strokeLinecap="round" opacity=".7"/>
        <rect x="264" y="124" width="32" height="27" rx="4" fill="#FF8A65" opacity=".75"/>
        <rect x="252" y="140" width="56" height="9" rx="2" fill="#1e0e08"/>
      </g>

      {/* bouncing question marks */}
      <g style={{animation:"sciQBounce 1.7s ease-in-out .9s infinite", transformOrigin:"80px 72px"}}>
        <text x="80" y="74" fill="#94a3b8" fontSize="22" fontWeight="bold" textAnchor="middle">?</text>
      </g>
      <g style={{animation:"sciQBounce 1.7s ease-in-out 1.2s infinite", transformOrigin:"180px 66px"}}>
        <text x="180" y="68" fill="#94a3b8" fontSize="22" fontWeight="bold" textAnchor="middle">?</text>
      </g>
      <g style={{animation:"sciQBounce 1.7s ease-in-out 1.5s infinite", transformOrigin:"280px 74px"}}>
        <text x="280" y="76" fill="#94a3b8" fontSize="22" fontWeight="bold" textAnchor="middle">?</text>
      </g>
    </svg>
  );
}

function S2() {
  const offsets = [0, 88, 176, 264, 352];
  const cards = [
    {x:52,  delay:"0s",   grade:"D−"},
    {x:148, delay:"1.2s", grade:"C−"},
    {x:244, delay:"2.3s", grade:"D"},
  ] as {x:number; delay:string; grade:string}[];

  return (
    <svg viewBox="0 0 360 200" className="w-full h-full" aria-hidden>
      {/* dark background */}
      <rect width="360" height="200" fill="#0f172a"/>

      {/* subtle brick wall lines */}
      {[0,1,2,3].flatMap(r =>
        [0,1,2,3,4,5].map(c => (
          <rect key={`b${r}${c}`}
            x={c*62+(r%2)*31} y={r*22}
            width="58" height="18" rx="1"
            fill="none" stroke="#1a2540" strokeWidth="0.8"/>
        ))
      )}

      {/* "ONE SIZE FITS ALL" banner */}
      <rect x="74" y="16" width="212" height="24" rx="4" fill="#1e293b" stroke="#374151" strokeWidth="1"/>
      <text x="180" y="32" fill="#6b7280" fontSize="9.5" fontWeight="bold"
        textAnchor="middle" letterSpacing="1.5">ONE SIZE FITS ALL</text>

      {/* conveyor belt — top rail */}
      <rect x="0" y="142" width="296" height="12" fill="#374151"/>
      {/* moving belt stripes */}
      <clipPath id="s2clip"><rect x="0" y="142" width="296" height="12"/></clipPath>
      <g clipPath="url(#s2clip)">
        <g style={{animation:"sciConveyor 1.4s linear infinite"}}>
          {Array.from({length:18}, (_,i) => (
            <line key={i} x1={i*22-8} y1="142" x2={i*22-8} y2="154"
              stroke="#4b5563" strokeWidth="2.5"/>
          ))}
        </g>
      </g>
      {/* belt underside shadow */}
      <rect x="0" y="154" width="296" height="6" fill="#1f2937"/>
      {/* left roller */}
      <circle cx="10" cy="148" r="8" fill="#4b5563"/>
      <circle cx="10" cy="148" r="3" fill="#2d3748"/>
      {/* right roller */}
      <circle cx="290" cy="148" r="8" fill="#4b5563"/>
      <circle cx="290" cy="148" r="3" fill="#2d3748"/>

      {/* stamping machine — right side */}
      <rect x="304" y="76" width="56" height="84" rx="4" fill="#1e293b" stroke="#374151" strokeWidth="1.5"/>
      <rect x="310" y="82" width="44" height="30" rx="2" fill="#111827"/>
      <text x="332" y="97"  fill="#6b7280" fontSize="5.5" fontWeight="bold" textAnchor="middle">SAME</text>
      <text x="332" y="104" fill="#6b7280" fontSize="5.5" fontWeight="bold" textAnchor="middle">FOR ALL</text>
      {/* output arm */}
      <rect x="282" y="118" width="24" height="5" rx="2" fill="#374151"/>
      {/* stacked papers */}
      <rect x="310" y="120" width="24" height="30" rx="2" fill="#94a3b8" opacity=".4"/>
      <rect x="313" y="123" width="24" height="30" rx="2" fill="#b0b8c4" opacity=".4"/>
      <rect x="316" y="126" width="24" height="30" rx="2" fill="#d1d5db" opacity=".65"/>
      <line x1="319" y1="133" x2="337" y2="133" stroke="#9ca3af" strokeWidth="1.2"/>
      <line x1="319" y1="138" x2="335" y2="138" stroke="#9ca3af" strokeWidth="1.2"/>
      <line x1="319" y1="143" x2="336" y2="143" stroke="#9ca3af" strokeWidth="1.2"/>
      <text x="328" y="131" fill="#dc2626" fontSize="6" fontWeight="bold" textAnchor="middle">COPY</text>

      {/* children on belt — looping */}
      <g style={{animation:"sciConveyor 3.4s linear infinite"}}>
        {offsets.map(ox => (
          <g key={ox}>
            {/* head */}
            <circle cx={46+ox} cy={112} r={16} fill="#475569"/>
            {/* downcast eyes */}
            <circle cx={41+ox} cy={109} r={2.2} fill="#1e293b"/>
            <circle cx={51+ox} cy={109} r={2.2} fill="#1e293b"/>
            {/* sad mouth */}
            <path d={`M${41+ox} 119 Q${46+ox} 115 ${51+ox} 119`}
              stroke="#1e293b" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
            {/* body */}
            <rect x={35+ox} y={129} width="22" height="18" rx="3" fill="#334155"/>
            {/* identical worksheet held up */}
            <rect x={54+ox} y={122} width="14" height="18" rx="2" fill="#94a3b8" opacity=".85"/>
            <line x1={57+ox} y1={127} x2={65+ox} y2={127} stroke="#64748b" strokeWidth="1.1"/>
            <line x1={57+ox} y1={131} x2={65+ox} y2={131} stroke="#64748b" strokeWidth="1.1"/>
            <line x1={57+ox} y1={135} x2={65+ox} y2={135} stroke="#64748b" strokeWidth="1.1"/>
          </g>
        ))}
      </g>

      {/* falling report cards */}
      {cards.map(({x, delay, grade}) => (
        <g key={x} style={{animation:`sciCardFall 2.4s ease-in ${delay} infinite`}}>
          <rect x={x-17} y="46" width="34" height="42" rx="3" fill="#e5e7eb" opacity=".92"/>
          <line x1={x-11} y1="55" x2={x+11} y2="55" stroke="#9ca3af" strokeWidth="1.2"/>
          <line x1={x-11} y1="61" x2={x+8}  y2="61" stroke="#9ca3af" strokeWidth="1.2"/>
          <line x1={x-11} y1="67" x2={x+10} y2="67" stroke="#9ca3af" strokeWidth="1.2"/>
          <text x={x} y="82" fill="#dc2626" fontSize="14" fontWeight="bold" textAnchor="middle">{grade}</text>
        </g>
      ))}
    </svg>
  );
}

function S3() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* amber glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div style={{width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,209,102,.35) 0%,transparent 70%)",animation:"sciGlowPulse 3s ease-in-out infinite"}}/>
      </div>
      <svg viewBox="0 0 360 200" className="relative w-full h-full" aria-hidden>
        {/* table */}
        <rect x="80" y="130" width="200" height="11" rx="3" fill="#92400e" opacity=".8"/>
        <rect x="98" y="141" width="7" height="36" rx="2" fill="#78350f" opacity=".7"/>
        <rect x="255" y="141" width="7" height="36" rx="2" fill="#78350f" opacity=".7"/>
        {/* tutor */}
        <g style={{animation:"sciFadeUp .5s ease .1s both"}}>
          <circle cx="130" cy="100" r="20" fill="#FFD166"/>
          <circle cx="124" cy="97" r="2.8" fill="#78350f" opacity=".75"/>
          <circle cx="136" cy="97" r="2.8" fill="#78350f" opacity=".75"/>
          <path d="M124 109 Q130 114 136 109" stroke="#78350f" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <rect x="114" y="121" width="32" height="26" rx="4" fill="#FFD166" opacity=".7"/>
          <rect x="100" y="115" width="20" height="26" rx="2" fill="#e2e8f0"/>
          <rect x="107" y="112" width="7" height="5" rx="1" fill="#94a3b8"/>
          <line x1="103" y1="122" x2="118" y2="122" stroke="#94a3b8" strokeWidth="1.4"/>
          <line x1="103" y1="127" x2="116" y2="127" stroke="#94a3b8" strokeWidth="1.4"/>
          <line x1="103" y1="132" x2="117" y2="132" stroke="#94a3b8" strokeWidth="1.4"/>
        </g>
        {/* child */}
        <g style={{animation:"sciFadeUp .5s ease .3s both"}}>
          <circle cx="230" cy="102" r="20" fill="#00B8A9"/>
          <circle cx="224" cy="99" r="2.8" fill="white" opacity=".85"/>
          <circle cx="236" cy="99" r="2.8" fill="white" opacity=".85"/>
          <path d="M224 111 Q230 116 236 111" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <rect x="214" y="123" width="32" height="26" rx="4" fill="#00B8A9" opacity=".7"/>
        </g>
        {/* subject icons */}
        <g style={{animation:"sciIconLight .6s ease .8s both", transformOrigin:"38px 70px"}}>
          <circle cx="38" cy="70" r="22" fill="#1e3a5f" stroke="#4A90E2" strokeWidth="2"/>
          <text x="38" y="77" fill="#4A90E2" fontSize="18" fontWeight="bold" textAnchor="middle">+</text>
        </g>
        <text x="38" y="102" fill="#64748b" fontSize="8" textAnchor="middle" style={{animation:"sciFadeIn .4s ease 1.1s both"}}>Math</text>

        <g style={{animation:"sciIconLight .6s ease 1.3s both", transformOrigin:"38px 140px"}}>
          <circle cx="38" cy="140" r="22" fill="#0f2a1a" stroke="#00B8A9" strokeWidth="2"/>
          <rect x="28" y="132" width="18" height="14" rx="2" fill="none" stroke="#00B8A9" strokeWidth="1.8"/>
          <line x1="38" y1="132" x2="38" y2="146" stroke="#00B8A9" strokeWidth="1.4"/>
        </g>
        <text x="38" y="172" fill="#64748b" fontSize="8" textAnchor="middle" style={{animation:"sciFadeIn .4s ease 1.6s both"}}>Reading</text>

        <g style={{animation:"sciIconLight .6s ease 1.8s both", transformOrigin:"322px 70px"}}>
          <circle cx="322" cy="70" r="22" fill="#3b1a0f" stroke="#FF8A65" strokeWidth="2"/>
          <path d="M313 77 L320 63 L328 71 L321 85 Z" fill="none" stroke="#FF8A65" strokeWidth="1.8"/>
          <line x1="310" y1="79" x2="322" y2="81" stroke="#FF8A65" strokeWidth="1.4"/>
        </g>
        <text x="322" y="102" fill="#64748b" fontSize="8" textAnchor="middle" style={{animation:"sciFadeIn .4s ease 2.1s both"}}>Writing</text>
      </svg>
    </div>
  );
}

function S4() {
  return (
    <svg viewBox="0 0 360 200" className="w-full h-full" aria-hidden>
      {/* document */}
      <g style={{animation:"sciFadeUp .5s ease .1s both"}}>
        <ellipse cx="180" cy="32" rx="68" ry="7" fill="#0d2a1c" opacity=".9"/>
        <rect x="112" y="30" width="136" height="132" rx="4" fill="#0a1f14" stroke="#00B8A9" strokeWidth="1.4"/>
        <text x="180" y="52" fill="#00B8A9" fontSize="8.5" fontWeight="bold" textAnchor="middle" style={{animation:"sciFadeIn .3s ease .5s both"}}>Personalized Learning Plan</text>
        <text x="180" y="64" fill="#64748b" fontSize="7" textAnchor="middle" style={{animation:"sciFadeIn .3s ease .7s both"}}>[Child&apos;s Name]</text>
      </g>
      {/* plan items */}
      {[
        {y:85,color:"#00B8A9",w:96,delay:".9s"},
        {y:103,color:"#FFD166",w:78,delay:"1.2s"},
        {y:121,color:"#FF8A65",w:88,delay:"1.5s"},
        {y:139,color:"#4A90E2",w:68,delay:"1.8s"},
      ].map(({y,color,w,delay})=>(
        <g key={y} style={{animation:`sciFadeUp .4s ease ${delay} both`}}>
          <circle cx="125" cy={y} r="4" fill={color}/>
          <rect x="133" y={y-5} width={w} height="8" rx="2" fill={color} opacity=".65"/>
        </g>
      ))}
      {/* glowing path */}
      <path d="M248 110 C276 110 296 126 316 136 C336 146 348 156 348 172"
        stroke="#00B8A9" strokeWidth="3" fill="none" strokeLinecap="round"
        strokeDasharray="300"
        style={{animation:"sciPathTrace 2.2s ease 1.6s both"}}/>
      <path d="M248 110 C276 110 296 126 316 136 C336 146 348 156 348 172"
        stroke="#00B8A9" strokeWidth="9" fill="none" strokeLinecap="round"
        strokeDasharray="300" opacity=".15"
        style={{animation:"sciPathTrace 2.2s ease 1.6s both"}}/>
      <circle cx="348" cy="172" r="8" fill="#00B8A9" opacity=".9" style={{animation:"sciScaleIn .4s ease 3.5s both", transformOrigin:"348px 172px"}}/>
      <text x="348" y="176" fill="white" fontSize="9" textAnchor="middle" style={{animation:"sciFadeIn .3s ease 3.7s both"}}>→</text>
    </svg>
  );
}

function S5() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      <div className="w-full max-w-[280px] space-y-5">
        {/* progress bar */}
        <div style={{animation:"sciFadeUp .5s ease .1s both"}}>
          <div className="flex justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Monthly Progress</span>
            <span className="text-[10px] font-bold text-brand-teal" style={{animation:"sciFadeIn .3s ease 2.8s both"}}>82%</span>
          </div>
          <div className="h-3.5 rounded-full bg-slate-700/60 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-sky to-brand-teal"
              style={{width:0,animation:"sciProgressFill 2.6s cubic-bezier(.4,0,.2,1) .4s forwards"}}/>
          </div>
        </div>
        {/* subject bars */}
        <div className="grid grid-cols-4 gap-2" style={{animation:"sciFadeUp .4s ease .7s both"}}>
          {[["Reading","#00B8A9",90],["Math","#4A90E2",76],["Writing","#FF8A65",84],["Confidence","#FFD166",95]].map(([label,color,pct],i)=>(
            <div key={label as string} className="rounded-lg bg-slate-800/60 p-2 text-center"
              style={{animation:`sciScaleIn .4s ease ${.9+i*.18}s both`, transformOrigin:"center"}}>
              <div className="h-1.5 rounded-full bg-slate-700 mb-1.5 overflow-hidden">
                <div className="h-full rounded-full" style={{backgroundColor:color as string,width:0,animation:`sciProgressFill 1.2s ease ${1.1+i*.2}s forwards`}}/>
              </div>
              <p className="text-[8px] font-semibold text-slate-400 leading-tight">{label}</p>
            </div>
          ))}
        </div>
        {/* notification */}
        <div className="flex items-center gap-3 rounded-xl border border-brand-sky/25 bg-slate-800/70 p-3"
          style={{animation:"sciSlideRight .55s ease 1.9s both"}}>
          <div className="relative shrink-0 flex h-10 w-6 items-center justify-center rounded-md border border-slate-600 bg-slate-700">
            <div className="h-5 w-4 rounded-sm bg-brand-sky/20"/>
            <div className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full bg-brand-rose"
              style={{animation:"sciBadgePop .4s ease 2.4s both", transform:"scale(0)"}}/>
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-tight">Progress Update Ready</p>
            <p className="text-[10px] text-slate-400">Kriana Tutoring · just now</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function S6() {
  const stars: {cx:number;cy:number;delay:string}[] = [
    {cx:62,cy:80,delay:".8s"},{cx:98,cy:75,delay:"1s"},{cx:55,cy:100,delay:"1.2s"},
    {cx:163,cy:74,delay:".9s"},{cx:197,cy:80,delay:"1.1s"},{cx:160,cy:98,delay:"1.3s"},
    {cx:263,cy:78,delay:"1s"},{cx:297,cy:84,delay:"1.2s"},{cx:300,cy:100,delay:"1.4s"},
  ];
  return (
    <svg viewBox="0 0 360 200" className="w-full h-full" aria-hidden>
      <rect x="20" y="148" width="320" height="10" rx="3" fill="#334155"/>
      {/* child 1 */}
      <g style={{animation:"sciColorPop .8s ease .3s both, sciFadeUp .5s ease .1s both"}}>
        <circle cx="80" cy="102" r="19" fill="#00B8A9"/>
        <circle cx="75" cy="99" r="2.5" fill="white" opacity=".9"/><circle cx="85" cy="99" r="2.5" fill="white" opacity=".9"/>
        <path d="M75 109 Q80 115 85 109" stroke="white" strokeWidth="2.4" fill="none" strokeLinecap="round"/>
        <rect x="64" y="122" width="32" height="27" rx="4" fill="#00B8A9" opacity=".8"/>
        <line x1="64" y1="126" x2="48" y2="100" stroke="#00B8A9" strokeWidth="5" strokeLinecap="round"/>
        <rect x="50" y="140" width="60" height="9" rx="2" fill="#0a1e15"/>
        <path d="M56 143 L63 148 L72 140" stroke="#00B8A9" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </g>
      {/* child 2 */}
      <g style={{animation:"sciColorPop .8s ease .5s both, sciFadeUp .5s ease .3s both"}}>
        <circle cx="180" cy="97" r="19" fill="#FFD166"/>
        <circle cx="175" cy="94" r="2.5" fill="#78350f" opacity=".85"/><circle cx="185" cy="94" r="2.5" fill="#78350f" opacity=".85"/>
        <path d="M175 106 Q180 111 185 106" stroke="#78350f" strokeWidth="2.4" fill="none" strokeLinecap="round"/>
        <rect x="164" y="117" width="32" height="27" rx="4" fill="#FFD166" opacity=".8"/>
        <rect x="150" y="140" width="60" height="9" rx="2" fill="#1a140a"/>
        <path d="M156 143 L163 148 L172 140" stroke="#FFD166" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </g>
      {/* child 3 */}
      <g style={{animation:"sciColorPop .8s ease .7s both, sciFadeUp .5s ease .5s both"}}>
        <circle cx="280" cy="102" r="19" fill="#FF8A65"/>
        <circle cx="275" cy="99" r="2.5" fill="#7c2d12" opacity=".85"/><circle cx="285" cy="99" r="2.5" fill="#7c2d12" opacity=".85"/>
        <path d="M275 109 Q280 115 285 109" stroke="#7c2d12" strokeWidth="2.4" fill="none" strokeLinecap="round"/>
        <rect x="264" y="122" width="32" height="27" rx="4" fill="#FF8A65" opacity=".8"/>
        <line x1="296" y1="126" x2="312" y2="100" stroke="#FF8A65" strokeWidth="5" strokeLinecap="round"/>
        <rect x="250" y="140" width="60" height="9" rx="2" fill="#1e0e08"/>
        <path d="M256 143 L263 148 L272 140" stroke="#FF8A65" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </g>
      {/* stars */}
      {stars.map(({cx,cy,delay},i)=>(
        <polygon key={i} points={`${cx},${cy-7} ${cx+2},${cy-2} ${cx+7},${cy-2} ${cx+3},${cy+2} ${cx+5},${cy+7} ${cx},${cy+4} ${cx-5},${cy+7} ${cx-3},${cy+2} ${cx-7},${cy-2} ${cx-2},${cy-2}`}
          fill="#FFD166" opacity=".9"
          style={{animation:`sciStarBurst .5s ease ${delay} both`, transformOrigin:`${cx}px ${cy}px`}}/>
      ))}
    </svg>
  );
}

function S7() {
  const skyline = [10,16,22,12,28,14,20,34,16,12,20,14,10];
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center gap-3 overflow-hidden px-6">
      {/* skyline */}
      <div className="absolute bottom-0 inset-x-0 flex items-end justify-center gap-px px-2 pointer-events-none"
        style={{animation:"sciSkyline 1s ease .5s both"}}>
        {skyline.map((h,i)=>(
          <div key={i} className="bg-slate-400 rounded-t-sm shrink-0" style={{height:h*2.6,width:14+(i%3)*4}}/>
        ))}
      </div>
      {/* text */}
      <div className="relative z-10 text-center space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.45em] text-brand-sky"
          style={{animation:"sciFadeUp .4s ease .2s both"}}>Ottawa, Ontario</p>
        <h3 className="text-4xl font-black tracking-tight text-white sm:text-5xl"
          style={{animation:"sciTypeIn .9s ease .5s both"}}>KRIANA</h3>
        <p className="text-sm font-bold uppercase tracking-[0.4em] text-brand-teal"
          style={{animation:"sciFadeUp .4s ease .9s both"}}>Tutoring</p>
        <p className="text-xs text-slate-400 max-w-[180px] mx-auto leading-relaxed"
          style={{animation:"sciFadeUp .4s ease 1.1s both"}}>
          Personalized Learning For Every Child.
        </p>
        <div style={{animation:"sciFadeUp .4s ease 1.3s both"}}>
          <Link href="/booking/VQNj7NfFGCI5oun5PXQE"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-sky to-brand-teal px-6 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-white"
            style={{animation:"sciCtaPulse 2s ease-in-out 1.8s infinite"}}>
            Book a Free Assessment
          </Link>
        </div>
        <p className="text-[9px] text-slate-600 tracking-wider"
          style={{animation:"sciFadeIn .4s ease 2s both"}}>krianatutoring.com</p>
      </div>
    </div>
  );
}

const ILLUSTRATIONS = [S1, S2, S3, S4, S5, S6, S7];

/* ─────────── player shell ─────────── */

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const preferred = [
    "Samantha", "Karen", "Moira",
    "Google UK English Female",
    "Google US English",
    "Microsoft Aria Online (Natural)",
    "Microsoft Jenny Online (Natural)",
  ];
  for (const name of preferred) {
    const v = voices.find(v => v.name === name);
    if (v) return v;
  }
  return voices.find(v => v.lang.startsWith("en")) ?? null;
}

// Split text into natural sentence chunks for paced speech
function toChunks(text: string): string[] {
  return text
    .replace(/—/g, ". ")
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 2);
}

export function VideoStoryboard() {
  const [active, setActive]   = useState(0);
  const [playing, setPlaying] = useState(true);
  const [animKey, setAnimKey] = useState(0);
  const [audioOn, setAudioOn] = useState(false);
  const [subtitle, setSubtitle] = useState("");
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // load best voice once
  useEffect(() => {
    if (typeof window === "undefined") return;
    const load = () => { voiceRef.current = pickVoice(); };
    if (window.speechSynthesis.getVoices().length) { load(); }
    else { window.speechSynthesis.addEventListener("voiceschanged", load, { once: true }); }
  }, []);

  const speakWithPauses = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setSubtitle("");
    const chunks = toChunks(text);
    let cancelled = false;

    function next(i: number) {
      if (cancelled || i >= chunks.length) { setSubtitle(""); return; }
      const utt = new SpeechSynthesisUtterance(chunks[i]);
      utt.rate = 0.87;
      utt.pitch = 1.02;
      utt.volume = 1;
      if (voiceRef.current) utt.voice = voiceRef.current;
      setSubtitle(chunks[i]);
      // longer pause after a sentence-ending period, shorter after comma-clause
      const pauseMs = /[.!?]$/.test(chunks[i]) ? 420 : 180;
      utt.onend = () => setTimeout(() => next(i + 1), pauseMs);
      window.speechSynthesis.speak(utt);
    }

    next(0);
    return () => { cancelled = true; };
  }, []);

  const goTo = useCallback((idx: number) => {
    setActive(idx);
    setAnimKey(k => k + 1);
  }, []);

  const next = useCallback(() => goTo((active + 1) % SCENES.length), [active, goTo]);
  const prev = useCallback(() => goTo((active + SCENES.length - 1) % SCENES.length), [active, goTo]);

  useEffect(() => {
    if (!audioOn) { window.speechSynthesis?.cancel(); setSubtitle(""); return; }
    speakWithPauses(SCENES[active].voiceover);
  }, [active, audioOn, speakWithPauses]);

  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setActive(a => (a + 1) % SCENES.length);
      setAnimKey(k => k + 1);
    }, SCENE_MS);
    return () => clearInterval(id);
  }, [playing]);

  const scene = SCENES[active];
  const Illustration = ILLUSTRATIONS[active];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-24">
      <style dangerouslySetInnerHTML={{ __html: ANIM_CSS }} />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-brand-sky/8 blur-3xl"/>
        <div className="absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-brand-teal/8 blur-3xl"/>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-sky/30 to-transparent"/>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-teal/20 to-transparent"/>
      </div>

      <div className="relative mx-auto max-w-6xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="Animated Explainer · 60–90 seconds"
          title="Our Story in Seven Scenes"
          description="An animated journey showing every child's path from confusion to confidence — ready for a motion graphics studio."
          tone="dark"
        />

        <div className="mt-12 overflow-hidden rounded-3xl border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">

          {/* progress bar */}
          <div className="h-1 bg-slate-700/40">
            <div
              key={`bar-${animKey}`}
              className="h-full bg-gradient-to-r from-brand-sky to-brand-teal"
              style={{
                width: playing ? "100%" : "4%",
                transition: playing ? `width ${SCENE_MS}ms linear` : "none",
              }}
            />
          </div>

          {/* full-width illustration */}
          <div className="relative bg-slate-950/50" style={{ minHeight: 420 }}>
            <div key={animKey} className="flex items-center justify-center w-full" style={{ minHeight: 420 }}>
              <Illustration />
            </div>

            {/* scene badge — top left */}
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1 backdrop-blur-sm">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: scene.accent }}>
                Scene {scene.id}
              </span>
              <span className="text-[10px] text-slate-500">{scene.duration}</span>
            </div>

            {/* audio toggle — top right */}
            <button
              onClick={() => setAudioOn(on => !on)}
              title={audioOn ? "Mute voiceover" : "Enable voiceover"}
              className={`absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-sm transition-all ${
                audioOn
                  ? "border-brand-sky/60 bg-brand-sky/20 text-brand-sky"
                  : "border-white/10 bg-black/40 text-slate-500 hover:border-white/30 hover:text-white"
              }`}>
              {audioOn ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5 6 9H2v6h4l5 4V5ZM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5 6 9H2v6h4l5 4V5ZM23 9l-6 6M17 9l6 6"/>
                </svg>
              )}
            </button>

            {/* scene title — centered overlay above caption */}
            <div className="absolute bottom-14 left-0 right-0 px-5 text-center">
              <p className="text-base font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{scene.title}</p>
            </div>

            {/* subtitle caption — centered bottom overlay */}
            <div className="absolute bottom-0 left-0 right-0 min-h-[44px] flex items-center justify-center bg-black/65 px-8 py-2 backdrop-blur-sm">
              {subtitle ? (
                <p className="text-sm leading-snug text-white/95 text-center">{subtitle}</p>
              ) : (
                <p className="text-[11px] text-slate-500 italic text-center">
                  {audioOn ? "Speaking…" : "Click 🔊 above to enable voiceover"}
                </p>
              )}
            </div>
          </div>

          {/* controls bar */}
          <div className="flex items-center justify-between border-t border-white/10 bg-slate-900/70 px-5 py-3">

            {/* playback + scene dots */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <button onClick={prev}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-all hover:border-white/30 hover:text-white">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                <button onClick={() => setPlaying(p => !p)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-all hover:border-white/30 hover:text-white">
                  {playing
                    ? <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
                    : <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  }
                </button>
                <button onClick={next}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-all hover:border-white/30 hover:text-white">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>

              {/* scene dots */}
              <div className="flex gap-1.5">
                {SCENES.map((s, i) => (
                  <button key={s.id} onClick={() => goTo(i)}
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: i === active ? 24 : 8,
                      backgroundColor: i === active ? scene.accent : "rgba(255,255,255,0.15)",
                    }}
                  />
                ))}
              </div>
            </div>

            <Link href="/booking/VQNj7NfFGCI5oun5PXQE"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-sky to-brand-teal px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_4px_16px_rgba(74,144,226,0.4)] transition-all hover:scale-[1.03]">
              Book Free Assessment
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
