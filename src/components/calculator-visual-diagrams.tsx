'use client';

import React from 'react';
import type {
    EnergyClassId,
    MaxFlowTempC,
    PipeSpacingCm,
    RadiatorConnectionType,
    RadiatorControlType,
} from '../lib/scientific-calculators';

export interface BoilerHouseVisualProps {
    areaM2: number;
    energyClass: EnergyClassId;
    indoorTempC: number;
    occupants: number;
    recommendedBoilerKw: number;
    recommendedCylinderLiters: number;
}

export function BoilerHouseVisual({
    areaM2,
    energyClass,
    indoorTempC,
    occupants,
    recommendedBoilerKw,
    recommendedCylinderLiters,
}: BoilerHouseVisualProps) {
    const isHighClass = energyClass === 'A++' || energyClass === 'A+' || energyClass === 'A';
    const isMidClass = energyClass === 'B' || energyClass === 'C';
    const insulationColor = isHighClass ? 'var(--data-ok)' : isMidClass ? 'var(--data-warn)' : 'var(--primary)';
    const insulationLabel = isHighClass
        ? `${energyClass} klasė: maži šilumos nuostoliai`
        : isMidClass
          ? `${energyClass} klasė: vidutinė izoliacija`
          : 'Senas namas: didesni šilumos nuostoliai per sienas';
    const wallStrokeWidth = isHighClass ? 8 : isMidClass ? 5 : 3;
    const cylinderFillPct =
        recommendedCylinderLiters > 0
            ? Math.min(100, Math.max(25, Math.round((occupants / 8) * 100)))
            : 0;
    const kwPct = Math.min(100, Math.max(12, Math.round((recommendedBoilerKw / 35) * 100)));

    return (
        <div
            data-testid="visual-diagram-boiler"
            className="rounded-md border border-stone-300 bg-white text-stone-900 p-4 sm:p-5 overflow-hidden"
        >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                    <span className="text-xs font-semibold text-stone-500">
                        Namo ir katilinės šilumos schema
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-stone-900">
                        {insulationLabel}
                    </h4>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-xs bg-stone-100 text-stone-800 border border-stone-300">
                    {areaM2} m², +{indoorTempC} °C viduje
                </span>
            </div>

            <svg
                viewBox="0 0 540 200"
                className="w-full h-auto rounded-sm bg-[var(--surface-paper)] border border-stone-200"
                role="img"
                aria-label="Namo šilumos ir katilo parinkimo schema"
            >
                <polygon
                    points="40,78 175,20 310,78"
                    fill="var(--surface-subtle)"
                    stroke={insulationColor}
                    strokeWidth={wallStrokeWidth}
                    strokeLinejoin="round"
                />
                <rect
                    x="55"
                    y="78"
                    width="240"
                    height="100"
                    fill="var(--card)"
                    stroke={insulationColor}
                    strokeWidth={wallStrokeWidth}
                />

                <rect x="68" y="166" width="214" height="5" rx="2" fill="var(--primary)" />

                <rect x="82" y="94" width="126" height="46" rx="4" fill="var(--surface-subtle)" stroke="var(--border)" strokeWidth="1.2" />
                <text x="92" y="112" fill="var(--muted-foreground)" fontSize="10" fontWeight="600">
                    Plotas: {areaM2} m²
                </text>
                <text x="92" y="130" fill="var(--foreground)" fontSize="12" fontWeight="700">
                    Vidaus temp.: +{indoorTempC} °C
                </text>

                <rect x="335" y="50" width="84" height="124" rx="5" fill="var(--card)" stroke="var(--primary)" strokeWidth="2" />
                <text x="377" y="70" textAnchor="middle" fill="var(--muted-foreground)" fontSize="10" fontWeight="600">
                    Šilumos šaltinis
                </text>
                <text x="377" y="116" textAnchor="middle" fill="var(--primary)" fontSize="15" fontWeight="700">
                    {recommendedBoilerKw.toFixed(1)} kW
                </text>
                <text x="377" y="138" textAnchor="middle" fill="var(--muted-foreground)" fontSize="10">
                    Šildymo galia
                </text>

                <rect x="434" y="58" width="76" height="116" rx="12" fill="var(--card)" stroke="var(--secondary)" strokeWidth="2" />
                {cylinderFillPct > 0 && (
                    <rect
                        x="437"
                        y={171 - (cylinderFillPct / 100) * 80}
                        width="70"
                        height={(cylinderFillPct / 100) * 80}
                        rx="9"
                        fill="var(--surface-subtle)"
                    />
                )}
                <text x="472" y="78" textAnchor="middle" fill="var(--secondary)" fontSize="10" fontWeight="600">
                    Boileris
                </text>
                <text x="472" y="118" textAnchor="middle" fill="var(--foreground)" fontSize="14" fontWeight="700">
                    {recommendedCylinderLiters > 0 ? `${recommendedCylinderLiters} l` : 'Momentinis'}
                </text>
                <text x="472" y="138" textAnchor="middle" fill="var(--muted-foreground)" fontSize="10">
                    {occupants} asm.
                </text>

                <line x1="295" y1="142" x2="335" y2="142" stroke="var(--primary)" strokeWidth="3.5" />
                <line x1="295" y1="156" x2="335" y2="156" stroke="var(--secondary)" strokeWidth="3.5" />
            </svg>

            <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-stone-600">Rekomenduojama katilo galios skalė:</span>
                    <span className="text-[var(--primary)] font-bold">{recommendedBoilerKw.toFixed(1)} kW</span>
                </div>
                <div className="h-2 w-full rounded-xs bg-stone-200 overflow-hidden">
                    <div
                        className="h-full bg-[var(--primary)] transition-all duration-150"
                        style={{ width: `${kwPct}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

export interface ExpansionVesselVisualProps {
    systemVolumeL: number;
    standardVesselLiters: number;
    prechargeBar: number;
    staticHeightM: number;
    maxFlowTempC: MaxFlowTempC;
}

export function ExpansionVesselVisual({
    systemVolumeL,
    standardVesselLiters,
    prechargeBar,
    staticHeightM,
    maxFlowTempC,
}: ExpansionVesselVisualProps) {
    const waterRatio = Math.min(0.68, Math.max(0.28, Number(maxFlowTempC) / 130));
    const tankInnerHeight = 124;
    const waterHeight = Math.round(tankInnerHeight * waterRatio);
    const gasHeight = tankInnerHeight - waterHeight;
    const membraneY = 42 + gasHeight;

    return (
        <div
            data-testid="visual-diagram-vessel"
            className="rounded-md border border-stone-300 bg-white text-stone-900 p-4 sm:p-5 overflow-hidden"
        >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                    <span className="text-xs font-semibold text-stone-500">
                        Membraninio plėtimosi indo pjūvis (Statico)
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-stone-900">
                        Vandens plėtimosi zona ir pradinis oro slėgis {prechargeBar.toFixed(1)} bar
                    </h4>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-xs bg-[var(--primary)] text-white">
                    {standardVesselLiters} l indas
                </span>
            </div>

            <svg
                viewBox="0 0 540 200"
                className="w-full h-auto rounded-sm bg-[var(--surface-paper)] border border-stone-200"
                role="img"
                aria-label="Plėtimosi indo pjūvio schema"
            >
                <line x1="58" y1="32" x2="58" y2="170" stroke="var(--secondary)" strokeWidth="2" />
                <line x1="48" y1="32" x2="68" y2="32" stroke="var(--secondary)" strokeWidth="2" />
                <line x1="48" y1="170" x2="68" y2="170" stroke="var(--secondary)" strokeWidth="2" />
                <text x="78" y="50" fill="var(--secondary)" fontSize="10" fontWeight="600">
                    Viršutinis taškas
                </text>
                <text x="78" y="102" fill="var(--foreground)" fontSize="13" fontWeight="700">
                    Pastato aukštis: {staticHeightM} m
                </text>
                <text x="78" y="122" fill="var(--muted-foreground)" fontSize="10">
                    Sistemoje ~{systemVolumeL.toFixed(0)} l vandens
                </text>
                <text x="78" y="166" fill="var(--primary)" fontSize="10" fontWeight="600">
                    Katilinė (iki {maxFlowTempC} °C)
                </text>

                <rect
                    x="228"
                    y="38"
                    width="116"
                    height="132"
                    rx="32"
                    fill="var(--card)"
                    stroke="var(--foreground)"
                    strokeWidth="2.5"
                />
                <rect
                    x="234"
                    y="42"
                    width="104"
                    height={gasHeight}
                    rx="22"
                    fill="var(--muted)"
                />
                <rect
                    x="234"
                    y={membraneY}
                    width="104"
                    height={waterHeight}
                    rx="22"
                    fill="var(--surface-subtle)"
                />
                <path
                    d={`M 234 ${membraneY} Q 286 ${membraneY + 10} 338 ${membraneY}`}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="2.5"
                />
                <text x="286" y={42 + Math.max(18, gasHeight / 2)} textAnchor="middle" fill="var(--data-warn)" fontSize="11" fontWeight="700">
                    Oras {prechargeBar.toFixed(1)} bar
                </text>
                <text x="286" y={membraneY + Math.max(20, waterHeight / 2)} textAnchor="middle" fill="var(--secondary)" fontSize="11" fontWeight="700">
                    Vanduo
                </text>

                <rect x="372" y="54" width="146" height="100" rx="6" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
                <text x="445" y="78" textAnchor="middle" fill="var(--muted-foreground)" fontSize="10" fontWeight="600">
                    Rekomenduojamas indas
                </text>
                <text x="445" y="110" textAnchor="middle" fill="var(--primary)" fontSize="20" fontWeight="700">
                    {standardVesselLiters} l
                </text>
                <text x="445" y="134" textAnchor="middle" fill="var(--secondary)" fontSize="11" fontWeight="600">
                    Oro slėgis: {prechargeBar.toFixed(1)} bar
                </text>
            </svg>
        </div>
    );
}

export interface UnderfloorManifoldVisualProps {
    floorAreaM2: number;
    pipeSpacingCm: PipeSpacingCm;
    recommendedLoops: number;
    flowPerLoopLmin: number;
}

export function UnderfloorManifoldVisual({
    floorAreaM2,
    pipeSpacingCm,
    recommendedLoops,
    flowPerLoopLmin,
}: UnderfloorManifoldVisualProps) {
    const activeLoops = Math.min(12, Math.max(2, recommendedLoops));
    const slots = Array.from({ length: 12 }, (_, idx) => idx < activeLoops);

    return (
        <div
            data-testid="visual-diagram-manifold"
            className="rounded-md border border-stone-300 bg-white text-stone-900 p-4 sm:p-5 overflow-hidden"
        >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                    <span className="text-xs font-semibold text-stone-500">
                        Grindinio šildymo kolektoriaus schema
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-stone-900">
                        Aktyvūs kontūrai: {activeLoops} iš 12 (žingsnis {pipeSpacingCm} cm, srautas {flowPerLoopLmin.toFixed(1)} l/min)
                    </h4>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-xs bg-stone-100 text-stone-900 border border-stone-300">
                    {floorAreaM2} m² ({activeLoops} kont.)
                </span>
            </div>

            <svg
                viewBox="0 0 540 205"
                className="w-full h-auto rounded-sm bg-[var(--surface-paper)] border border-stone-200"
                role="img"
                aria-label="Grindinio šildymo kolektoriaus ir kontūrų schema"
            >
                <rect x="28" y="20" width="484" height="16" rx="3" fill="var(--primary)" />
                <text x="38" y="31" fill="var(--card)" fontSize="9.5" fontWeight="600">
                    Tiekimo kolektorius (rotametrai po {flowPerLoopLmin.toFixed(1)} l/min)
                </text>
                <rect x="28" y="42" width="484" height="16" rx="3" fill="var(--secondary)" />
                <text x="38" y="53" fill="var(--card)" fontSize="9.5" fontWeight="600">
                    Grįžtamasis kolektorius (termoelektrinės pavaros M30×1,5)
                </text>

                {slots.map((isActive, idx) => {
                    const x = 34 + idx * 39;
                    const strokeSupply = isActive ? 'var(--primary)' : 'var(--border)';
                    const strokeReturn = isActive ? 'var(--secondary)' : 'var(--border-subtle)';
                    return (
                        <g key={idx}>
                            <rect
                                x={x + 4}
                                y="64"
                                width="24"
                                height="16"
                                rx="2"
                                fill={isActive ? 'var(--foreground)' : 'var(--border-subtle)'}
                            />
                            <text
                                x={x + 16}
                                y="75"
                                textAnchor="middle"
                                fill={isActive ? 'var(--card)' : 'var(--muted-foreground)'}
                                fontSize="9"
                                fontWeight="700"
                            >
                                {idx + 1}
                            </text>

                            <rect
                                x={x + 2}
                                y="86"
                                width="28"
                                height="104"
                                rx="4"
                                fill={isActive ? 'var(--card)' : 'var(--surface-subtle)'}
                                stroke={isActive ? 'var(--border)' : 'var(--border-subtle)'}
                                strokeWidth="1.2"
                            />
                            <path
                                d={`M ${x + 9} 92 V 176 C ${x + 9} 182, ${x + 23} 182, ${x + 23} 176 V 92`}
                                fill="none"
                                stroke={strokeSupply}
                                strokeWidth={isActive ? '2.2' : '1.2'}
                            />
                            <line
                                x1={x + 16}
                                y1="96"
                                x2={x + 16}
                                y2="174"
                                stroke={strokeReturn}
                                strokeWidth={isActive ? '1.6' : '1'}
                                strokeDasharray="3 3"
                            />
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

export interface RadiatorNodeVisualProps {
    radiatorCount: number;
    connectionType: RadiatorConnectionType;
    controlType: RadiatorControlType;
}

export function RadiatorNodeVisual({
    radiatorCount,
    connectionType,
    controlType,
}: RadiatorNodeVisualProps) {
    const isBottomVk = connectionType === 'bottom_vk_50mm';

    return (
        <div
            data-testid="visual-diagram-radiator"
            className="rounded-md border border-stone-300 bg-white text-stone-900 p-4 sm:p-5 overflow-hidden"
        >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                    <span className="text-xs font-semibold text-stone-500">
                        Radiatoriaus pajungimo mazgo schema
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-stone-900">
                        {isBottomVk
                            ? 'Apatinis VK 50 mm pajungimas per H-bloką'
                            : 'Šoninis DN15 (1/2") pajungimas su termostatiniu vožtuvu'}
                    </h4>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-xs bg-[var(--primary)] text-white">
                    {radiatorCount} vnt.
                </span>
            </div>

            <svg
                viewBox="0 0 540 200"
                className="w-full h-auto rounded-sm bg-[var(--surface-paper)] border border-stone-200"
                role="img"
                aria-label="Radiatoriaus pajungimo mazgo schema"
            >
                <rect x="44" y="30" width="236" height="118" rx="6" fill="var(--card)" stroke="var(--muted-foreground)" strokeWidth="2.5" />
                {[0, 1, 2, 3, 4, 5, 6, 7].map((fin) => (
                    <rect
                        key={fin}
                        x={62 + fin * 26}
                        y="42"
                        width="14"
                        height="94"
                        rx="2"
                        fill="var(--surface-subtle)"
                        stroke="var(--border)"
                        strokeWidth="1"
                    />
                ))}

                <rect x="280" y="34" width="38" height="22" rx="4" fill="var(--primary)" />
                <circle cx="312" cy="30" r="10" fill="var(--foreground)" />
                <text x="312" y="34" textAnchor="middle" fill="var(--card)" fontSize="10" fontWeight="700">
                    1
                </text>

                {isBottomVk ? (
                    <g>
                        <rect x="234" y="148" width="38" height="24" rx="3" fill="var(--secondary)" />
                        <line x1="244" y1="172" x2="244" y2="194" stroke="var(--primary)" strokeWidth="4" />
                        <line x1="262" y1="172" x2="262" y2="194" stroke="var(--secondary)" strokeWidth="4" />
                        <circle cx="282" cy="160" r="10" fill="var(--secondary)" />
                        <text x="282" y="164" textAnchor="middle" fill="var(--card)" fontSize="10" fontWeight="700">
                            2
                        </text>
                        <circle cx="222" cy="182" r="10" fill="var(--data-ok)" />
                        <text x="222" y="186" textAnchor="middle" fill="var(--card)" fontSize="10" fontWeight="700">
                            3
                        </text>
                    </g>
                ) : (
                    <g>
                        <line x1="280" y1="45" x2="326" y2="45" stroke="var(--primary)" strokeWidth="4" />
                        <rect x="280" y="124" width="32" height="18" rx="3" fill="var(--secondary)" />
                        <line x1="312" y1="133" x2="334" y2="133" stroke="var(--secondary)" strokeWidth="4" />
                        <circle cx="328" cy="118" r="10" fill="var(--secondary)" />
                        <text x="328" y="122" textAnchor="middle" fill="var(--card)" fontSize="10" fontWeight="700">
                            2
                        </text>
                        <circle cx="342" cy="145" r="10" fill="var(--data-ok)" />
                        <text x="342" y="149" textAnchor="middle" fill="var(--card)" fontSize="10" fontWeight="700">
                            3
                        </text>
                    </g>
                )}

                <rect x="352" y="28" width="168" height="148" rx="6" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
                <text x="364" y="52" fill="var(--primary)" fontSize="10.5" fontWeight="700">
                    1. Galvutės: {radiatorCount} vnt.
                </text>
                <text x="364" y="68" fill="var(--muted-foreground)" fontSize="9.5">
                    {controlType === 'afc_dynamic' ? 'AFC Eclipse / RA-DV' : 'Standartinis Kv'}
                </text>
                <text x="364" y="96" fill="var(--secondary)" fontSize="10.5" fontWeight="700">
                    2. {isBottomVk ? `H-blokai 50 mm: ${radiatorCount} vnt.` : `Grįžt. vožtuvai: ${radiatorCount} vnt.`}
                </text>
                <text x="364" y="112" fill="var(--muted-foreground)" fontSize="9.5">
                    {isBottomVk ? 'Multilux / RLV-K mazgas' : 'Regulux / RLV-S mazgas'}
                </text>
                <text x="364" y="140" fill="var(--data-ok)" fontSize="10.5" fontWeight="700">
                    3. Eurokonusai: {radiatorCount * 2} vnt.
                </text>
                <text x="364" y="156" fill="var(--muted-foreground)" fontSize="9.5">
                    2 vnt. kiekvienam radiatoriui
                </text>
            </svg>
        </div>
    );
}

export interface HydraulicPipeVisualProps {
    recommendedDn: string;
    waterVelocityMs: number;
    flowLh: number;
    requiredKv: number;
}

export function HydraulicPipeVisual({
    recommendedDn,
    waterVelocityMs,
    flowLh,
    requiredKv,
}: HydraulicPipeVisualProps) {
    const dnRadiusMap: Record<string, number> = {
        DN15: 22,
        DN20: 30,
        DN25: 38,
        DN32: 46,
        DN40: 54,
        DN50: 62,
    };
    const pipeRadius = dnRadiusMap[recommendedDn] ?? 32;
    const isQuiet = waterVelocityMs <= 0.75;
    const speedRatio = Math.min(1, Math.max(0.08, waterVelocityMs / 1.2));
    const angleRad = Math.PI - speedRatio * Math.PI;
    const needleX = 390 + Math.cos(angleRad) * 58;
    const needleY = 148 - Math.sin(angleRad) * 58;

    return (
        <div
            data-testid="visual-diagram-valve"
            className="rounded-md border border-stone-300 bg-white text-stone-900 p-4 sm:p-5 overflow-hidden"
        >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                    <span className="text-xs font-semibold text-stone-500">
                        Vamzdžio skerspjūvis ir srauto greitis
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-stone-900">
                        Rekomenduojamas skersmuo {recommendedDn} (srautas {flowLh.toFixed(0)} l/h, Kv = {requiredKv.toFixed(2)} m³/h)
                    </h4>
                </div>
                <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-xs ${
                        isQuiet ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                    }`}
                >
                    {waterVelocityMs.toFixed(2)} m/s ({isQuiet ? 'tylus darbas' : 'didelis greitis'})
                </span>
            </div>

            <svg
                viewBox="0 0 540 190"
                className="w-full h-auto rounded-sm bg-[var(--surface-paper)] border border-stone-200"
                role="img"
                aria-label="Vamzdžio skerspjūvio ir vandens greičio spidometro schema"
            >
                <circle
                    cx="145"
                    cy="96"
                    r={pipeRadius + 7}
                    fill="var(--border-subtle)"
                    stroke="var(--foreground)"
                    strokeWidth="2.5"
                />
                <circle
                    cx="145"
                    cy="96"
                    r={pipeRadius}
                    fill="var(--surface-subtle)"
                />
                <text x="145" y="93" textAnchor="middle" fill="var(--foreground)" fontSize="15" fontWeight="700">
                    {recommendedDn}
                </text>
                <text x="145" y="110" textAnchor="middle" fill="var(--secondary)" fontSize="10" fontWeight="600">
                    {flowLh.toFixed(0)} l/h
                </text>

                <path
                    d="M 320 146 A 70 70 0 0 1 460 146"
                    fill="none"
                    stroke="var(--border-subtle)"
                    strokeWidth="12"
                    strokeLinecap="round"
                />
                <path
                    d="M 320 146 A 70 70 0 0 1 418 82"
                    fill="none"
                    stroke="var(--data-ok)"
                    strokeWidth="9"
                    strokeLinecap="round"
                />
                <path
                    d="M 418 82 A 70 70 0 0 1 460 146"
                    fill="none"
                    stroke="var(--data-warn)"
                    strokeWidth="9"
                    strokeLinecap="round"
                />
                <line
                    x1="390"
                    y1="146"
                    x2={needleX}
                    y2={needleY}
                    stroke="var(--foreground)"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
                <circle cx="390" cy="146" r="5" fill="var(--primary)" />
                <text x="390" y="48" textAnchor="middle" fill="var(--muted-foreground)" fontSize="10.5" fontWeight="600">
                    Vandens greitis vamzdyje
                </text>
                <text x="390" y="172" textAnchor="middle" fill="var(--foreground)" fontSize="12" fontWeight="700">
                    v = {waterVelocityMs.toFixed(2)} m/s (norma iki 0,75 m/s)
                </text>
            </svg>
        </div>
    );
}
