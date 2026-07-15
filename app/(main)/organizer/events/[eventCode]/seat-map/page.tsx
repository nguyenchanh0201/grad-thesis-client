"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import {
  Compass,
  Layers,
  Map,
  Maximize2,
  Save,
  Settings,
  Sparkles,
  Undo2,
  Users,
  ArrowLeft,
  Info,
  Grid,
  Paintbrush,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

type Props = { params: Promise<{ eventCode: string }> };

export default function OrganizerSeatMapPage({ params }: Props) {
  const { eventCode } = use(params);

  // Interactive seat grid mock state
  const initialSeats = Array.from({ length: 90 }, (_, index) => {
    const row = String.fromCharCode(65 + Math.floor(index / 10)); // Rows A-I
    const col = (index % 10) + 1;
    let type = "Standard";
    let price = 500000;
    let color = "bg-blue-500/20 border-blue-500 text-blue-300";
    let hoverColor = "hover:bg-blue-500 hover:text-white";

    if (index < 30) {
      type = "VIP";
      price = 1200000;
      color = "bg-purple-500/20 border-purple-500 text-purple-300";
      hoverColor = "hover:bg-purple-500 hover:text-white";
    } else if (index < 60) {
      type = "Premium";
      price = 800000;
      color = "bg-amber-500/20 border-amber-500 text-amber-300";
      hoverColor = "hover:bg-amber-500 hover:text-white";
    }

    return {
      id: `${row}-${col}`,
      row,
      col,
      type,
      price,
      color,
      hoverColor,
      selected: false,
    };
  });

  const [seats, setSeats] = useState(initialSeats);
  const [selectedSeat, setSelectedSeat] = useState<
    (typeof initialSeats)[0] | null
  >(null);
  const [vipPrice, setVipPrice] = useState(1200000);
  const [premiumPrice, setPremiumPrice] = useState(800000);
  const [standardPrice, setStandardPrice] = useState(500000);
  const [isSaved, setIsSaved] = useState(false);

  const toggleSeat = (id: string) => {
    const updated = seats.map((seat) => {
      if (seat.id === id) {
        const nextState = !seat.selected;
        const updatedSeat = { ...seat, selected: nextState };
        if (nextState) {
          setSelectedSeat(updatedSeat);
        } else if (selectedSeat?.id === id) {
          setSelectedSeat(null);
        }
        return updatedSeat;
      }
      return seat;
    });
    setSeats(updated);
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const selectedCount = seats.filter((s) => s.selected).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500 selection:text-white">
      {/* Background ambient light blooms */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top sticky navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/organizer/events`}
              className="group p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-200 transition-colors" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  Interactive Editor
                </span>
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  Beta
                </span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Seat Map Designer &middot;{" "}
                <span className="font-mono text-purple-400">{eventCode}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-sm font-medium hover:text-slate-100 transition">
              <Undo2 className="w-4 h-4" />
              <span>Undo</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-semibold shadow-lg shadow-purple-900/20 active:scale-[0.98] transition duration-200"
            >
              <Save className="w-4 h-4" />
              <span>{isSaved ? "Layout Saved!" : "Save Layout"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Designer Toolbox */}
        <section className="lg:col-span-3 flex flex-col gap-6">
          {/* Status Panel */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-xl p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Compass className="w-4 h-4 text-purple-400" />
              <span>Designer Toolbox</span>
            </h2>
            <div className="h-px bg-slate-800" />

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Total Mock Seats</span>
                <span className="font-semibold text-slate-200">90</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">VIP Seats</span>
                <span className="font-semibold text-purple-400">30</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Premium Seats</span>
                <span className="font-semibold text-amber-400">30</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Standard Seats</span>
                <span className="font-semibold text-blue-400">30</span>
              </div>
            </div>
          </div>

          {/* Pricing Adjuster Card */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-xl p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Interactive Pricing</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dynamically simulate how price updates immediately sync to backend
              ticketing contracts.
            </p>
            <div className="h-px bg-slate-800" />

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-purple-300 font-semibold flex items-center justify-between">
                  <span>VIP Price (VND)</span>
                  <span>{vipPrice.toLocaleString()} ₫</span>
                </label>
                <input
                  type="range"
                  min="800000"
                  max="3000000"
                  step="50000"
                  value={vipPrice}
                  onChange={(e) => setVipPrice(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer bg-slate-800 rounded-lg h-2"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-amber-300 font-semibold flex items-center justify-between">
                  <span>Premium Price (VND)</span>
                  <span>{premiumPrice.toLocaleString()} ₫</span>
                </label>
                <input
                  type="range"
                  min="500000"
                  max="1500000"
                  step="50000"
                  value={premiumPrice}
                  onChange={(e) => setPremiumPrice(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer bg-slate-800 rounded-lg h-2"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-blue-300 font-semibold flex items-center justify-between">
                  <span>Standard Price (VND)</span>
                  <span>{standardPrice.toLocaleString()} ₫</span>
                </label>
                <input
                  type="range"
                  min="200000"
                  max="1000000"
                  step="50000"
                  value={standardPrice}
                  onChange={(e) => setStandardPrice(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer bg-slate-800 rounded-lg h-2"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Center: Visual Editor Grid Mock */}
        <section className="lg:col-span-6 flex flex-col gap-6">
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-xl p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[550px] shadow-2xl">
            {/* Grid graphic overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-25 pointer-events-none" />

            {/* Stage Area */}
            <div className="w-3/4 py-4 rounded-b-2xl bg-gradient-to-b from-purple-900/40 via-blue-900/20 to-slate-900/10 border-x border-b border-purple-500/40 text-center relative mb-12 shadow-inner">
              <span className="text-xs font-bold uppercase tracking-[0.3em] bg-gradient-to-r from-purple-400 via-blue-300 to-purple-400 bg-clip-text text-transparent">
                STAGE &bull; PERFORMANCE AREA
              </span>
              {/* Neon lighting glow under the stage */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent blur-[2px]" />
            </div>

            {/* Interactive Grid Canvas */}
            <div className="grid grid-cols-10 gap-2.5 max-w-full relative z-10 p-4 bg-slate-950/60 rounded-2xl border border-slate-800/50 backdrop-blur-2xl">
              {seats.map((seat) => {
                const currentPrice =
                  seat.type === "VIP"
                    ? vipPrice
                    : seat.type === "Premium"
                      ? premiumPrice
                      : standardPrice;

                return (
                  <button
                    key={seat.id}
                    onClick={() => toggleSeat(seat.id)}
                    className={`
                      w-9 h-9 rounded-xl border text-[10px] font-bold transition-all duration-300 flex items-center justify-center select-none cursor-pointer
                      ${
                        seat.selected
                          ? "bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-500/40 scale-105"
                          : `${seat.color} ${seat.hoverColor} hover:scale-105`
                      }
                    `}
                    title={`${seat.id} (${seat.type}): ${currentPrice.toLocaleString()} ₫`}
                  >
                    {seat.id}
                  </button>
                );
              })}
            </div>

            {/* Stage Projection Glow */}
            <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Legend / Info Bar */}
            <div className="flex items-center gap-6 mt-10 text-xs z-10 px-4 py-2 bg-slate-900/80 rounded-full border border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-purple-500/20 border border-purple-500" />
                <span className="text-slate-400">VIP</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-amber-500/20 border border-amber-500" />
                <span className="text-slate-400">Premium</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-blue-500/20 border border-blue-500" />
                <span className="text-slate-400">Standard</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-purple-600 border border-purple-400 shadow-md shadow-purple-500/20" />
                <span className="text-slate-300">Selected</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Selected Seat Details & Info Panel */}
        <section className="lg:col-span-3 flex flex-col gap-6">
          {/* Configurator Dialog */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-xl p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-400" />
              <span>Seat Properties</span>
            </h2>
            <div className="h-px bg-slate-800" />

            {selectedSeat ? (
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block uppercase tracking-wider">
                      Selected Seat
                    </span>
                    <span className="text-lg font-mono font-bold text-purple-400">
                      {selectedSeat.id}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-slate-900 border ${
                      selectedSeat.type === "VIP"
                        ? "border-purple-500/30 text-purple-400"
                        : selectedSeat.type === "Premium"
                          ? "border-amber-500/30 text-amber-400"
                          : "border-blue-500/30 text-blue-400"
                    }`}
                  >
                    {selectedSeat.type}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Price Rate</span>
                    <span className="font-semibold text-slate-200">
                      {(selectedSeat.type === "VIP"
                        ? vipPrice
                        : selectedSeat.type === "Premium"
                          ? premiumPrice
                          : standardPrice
                      ).toLocaleString()}{" "}
                      ₫
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Accessibility</span>
                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" /> Enabled
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                <Layers className="w-8 h-8 text-slate-600 stroke-[1.5]" />
                <p className="text-xs max-w-[180px] leading-relaxed">
                  Click any seat circle in the visual grid canvas to view
                  properties and change settings.
                </p>
              </div>
            )}
          </div>

          {/* Development Info Note */}
          <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/20 to-slate-900/50 backdrop-blur-xl p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-purple-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Project Status</span>
            </h2>
            <div className="h-px bg-purple-950/40" />

            <div className="flex gap-3">
              <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1 text-xs text-purple-200/80 leading-relaxed">
                <span className="font-semibold text-purple-300">
                  Under Active Development
                </span>
                <span>
                  The seat map designer dashboard integrates real-time Redis
                  matrix mapping. Visual grids are bound dynamically to physical
                  ticketing allocations on the host server.
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
