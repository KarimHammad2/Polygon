"use client";
/* eslint-disable @next/next/no-img-element */

import type React from "react";
import type {
  DraftArea,
  PurchaseFormState,
  PurchasedArea,
} from "@/types";

type Message = {
  type: "error" | "success" | "info";
  text: string;
};

type SidePanelProps = {
  draftArea?: DraftArea | null;
  formState: PurchaseFormState;
  onFormChange: (next: PurchaseFormState) => void;
  onDrawClick: () => void;
  onClearClick: () => void;
  onConfirm: () => void;
  onImageSelected: (file: File) => void;
  onRemoveImageFromArea: (areaId: string) => void;
  onSelectPurchased: (areaId: string) => void;
  onShowImage: (area: PurchasedArea) => void;
  purchasedAreas: PurchasedArea[];
  selectedArea?: PurchasedArea | null;
  adminMode: boolean;
  setAdminMode: (value: boolean) => void;
  message?: Message;
  confirmDisabled: boolean;
};

const badgeStyles: Record<Message["type"], string> = {
  error: "bg-red-100 text-red-700 border-red-200",
  success: "bg-emerald-100 text-emerald-700 border-emerald-200",
  info: "bg-sky-100 text-sky-700 border-sky-200",
};

const SidePanel = ({
  draftArea,
  formState,
  onFormChange,
  onDrawClick,
  onClearClick,
  onConfirm,
  onImageSelected,
  onRemoveImageFromArea,
  onSelectPurchased,
  onShowImage,
  purchasedAreas,
  selectedArea,
  adminMode,
  setAdminMode,
  message,
  confirmDisabled,
}: SidePanelProps) => {
  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelected(file);
    }
  };

  const updateForm = (updates: Partial<PurchaseFormState>) => {
    onFormChange({ ...formState, ...updates });
  };

  return (
    <aside className="flex h-full flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Buy a piece of the map
          </p>
          <h1 className="text-lg font-semibold text-slate-900">
            Draw, price, and lock your area
          </h1>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 accent-sky-600"
            checked={adminMode}
            onChange={(e) => setAdminMode(e.target.checked)}
          />
          Admin mode
        </label>
      </div>

      {message ? (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${badgeStyles[message.type]}`}
        >
          {message.text}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Draw a polygon, review the estimated price, and confirm purchase. In
          this demo, purchases are stored only in your browser via
          localStorage. Payments and a real backend/database would plug in here
          later.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onDrawClick}
          className="inline-flex flex-1 items-center justify-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700"
        >
          Draw area
        </button>
        <button
          type="button"
          onClick={onClearClick}
          className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Clear current selection
        </button>
      </div>

      {draftArea ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">Current draft</p>
          <div className="mt-2 grid grid-cols-2 gap-3 text-sm text-slate-700">
            <div>
              <p className="text-xs uppercase text-slate-500">Area</p>
              <p className="font-semibold">
                {draftArea.areaKm2.toFixed(2)} km²
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">
                Price per km²
              </p>
              <p className="font-semibold">
                €{draftArea.pricePerKm2.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Total price</p>
              <p className="font-semibold">
                €{draftArea.totalPrice.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Country code</p>
              <p className="font-semibold">{draftArea.countryCode}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            Confirm purchase locks this polygon. Future real payments would be
            initiated here.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          No polygon selected yet. Click “Draw area”, sketch your polygon, and
          we will calculate area, pricing, and total.
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">
            Add details & image
          </p>
          <p className="text-xs text-slate-500">Local-only storage</p>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-700">
            Name / Nickname
          </label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="e.g., My Pacific slice"
            value={formState.name}
            onChange={(e) => updateForm({ name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-700">
            Short description
          </label>
          <textarea
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="What makes this area special to you?"
            value={formState.description}
            onChange={(e) => updateForm({ description: e.target.value })}
          />
        </div>
        <label className="flex items-start gap-2 text-sm font-medium text-slate-800">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-sky-600"
            checked={formState.consent}
            onChange={(e) => updateForm({ consent: e.target.checked })}
          />
          <span>
            I will not upload illegal or inappropriate content (required for
            images).
          </span>
        </label>
        <div className="space-y-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold">Upload one image</p>
              <p className="text-xs text-slate-500">
                JPG/PNG/WEBP, max 5 MB. Client-side only.
              </p>
            </div>
            <label
              className={`inline-flex cursor-pointer items-center rounded-md px-3 py-1 text-xs font-semibold shadow-sm ${
                formState.consent
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "cursor-not-allowed bg-slate-200 text-slate-500"
              }`}
            >
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileInput}
                disabled={!formState.consent}
              />
              Choose file
            </label>
          </div>
          {formState.image?.objectUrl || formState.image?.dataUrl ? (
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2">
              <img
                src={formState.image.objectUrl ?? formState.image.dataUrl}
                alt={formState.image.fileName ?? "Uploaded preview"}
                className="h-16 w-20 rounded-md object-cover"
              />
              <div className="flex-1 text-xs text-slate-600">
                <p className="font-medium text-slate-800">
                  {formState.image.fileName}
                </p>
                <p>
                  {formState.image.mimeType ?? ""} ·{" "}
                  {(formState.image.sizeBytes ?? 0) / 1024 / 1024 <
                  0.01
                    ? "<0.01"
                    : ((formState.image.sizeBytes ?? 0) / 1024 / 1024).toFixed(
                        2,
                      )}{" "}
                  MB
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-600">
              Enable the consent checkbox to upload an image. The file stays in
              your browser (no cloud storage in this demo).
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={confirmDisabled}
        className={`mt-2 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition ${
          confirmDisabled
            ? "cursor-not-allowed bg-slate-200 text-slate-500"
            : "bg-emerald-600 text-white hover:bg-emerald-700"
        }`}
      >
        Confirm Purchase (no payment in this demo)
      </button>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">
            Purchased areas
          </p>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
            {purchasedAreas.length}
          </span>
        </div>
        <div className="space-y-2">
          {purchasedAreas.length === 0 ? (
            <p className="text-sm text-slate-600">
              No purchases yet. Confirm one to see it here.
            </p>
          ) : (
            purchasedAreas.map((area) => (
              <div
                key={area.id}
                className={`flex flex-col gap-2 rounded-lg border px-3 py-2 text-sm transition hover:border-slate-300 ${
                  selectedArea?.id === area.id
                    ? "border-sky-300 bg-sky-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {area.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {area.countryCode} · {area.areaKm2.toFixed(2)} km² · €
                      {area.pricePerKm2.toFixed(2)}/km²
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700"
                    onClick={() => onSelectPurchased(area.id)}
                  >
                    View
                  </button>
                </div>
                {area.imageObjectUrl || area.imageDataUrl ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={area.imageObjectUrl ?? area.imageDataUrl}
                      alt={area.name}
                      className="h-16 w-20 rounded-md object-cover"
                      onClick={() => onShowImage(area)}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-xs font-semibold text-sky-600 hover:text-sky-700"
                        onClick={() => onShowImage(area)}
                      >
                        Open
                      </button>
                      {adminMode ? (
                        <button
                          type="button"
                          className="text-xs font-semibold text-red-600 hover:text-red-700"
                          onClick={() => onRemoveImageFromArea(area.id)}
                        >
                          Remove image
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    No image provided.
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {selectedArea ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
          <p className="text-sm font-semibold text-slate-900">
            Selected area
          </p>
          <p className="mt-1 text-slate-700">{selectedArea.description}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
            <p>Area: {selectedArea.areaKm2.toFixed(2)} km²</p>
            <p>Country: {selectedArea.countryCode}</p>
            <p>
              Price: €{selectedArea.pricePerKm2.toFixed(2)}/km² · Total €
              {selectedArea.totalPrice.toFixed(2)}
            </p>
            <p>Saved locally on: {new Date(selectedArea.createdAt).toLocaleString()}</p>
          </div>
        </div>
      ) : null}

      {adminMode ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <p className="font-semibold text-amber-900">Admin mode (demo)</p>
          <p>
            Lets you audit all local purchases and remove stored images without
            affecting polygons. A real backend would enforce moderation here.
          </p>
        </div>
      ) : null}
    </aside>
  );
};

export default SidePanel;

