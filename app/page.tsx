"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { nanoid } from "nanoid";
import { computePricing } from "@/lib/pricing";
import { loadPurchasedAreas, savePurchasedAreas } from "@/lib/storage";
import SidePanel from "@/components/SidePanel";
import type {
  DraftArea,
  PurchaseFormState,
  PurchasedArea,
} from "@/types";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
});

type Message = { type: "error" | "success" | "info"; text: string };

const initialForm: PurchaseFormState = {
  name: "",
  description: "",
  consent: false,
  image: undefined,
};

export default function Home() {
  const [purchasedAreas, setPurchasedAreas] = useState<PurchasedArea[]>(() =>
    loadPurchasedAreas(),
  );
  const [draftArea, setDraftArea] = useState<DraftArea | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string>();
  const [adminMode, setAdminMode] = useState(false);
  const [formState, setFormState] = useState<PurchaseFormState>(initialForm);
  const [message, setMessage] = useState<Message | undefined>(undefined);
  const [drawRequestId, setDrawRequestId] = useState(0);
  const [clearRequestId, setClearRequestId] = useState(0);
  const [imageModalArea, setImageModalArea] = useState<PurchasedArea | null>(
    null,
  );

  const selectedArea = useMemo(
    () => purchasedAreas.find((area) => area.id === selectedAreaId),
    [purchasedAreas, selectedAreaId],
  );

  const pushMessage = (next?: Message) => {
    setMessage(next);
  };

  const handlePolygonCreated = ({
    geometry,
    areaKm2,
    centroid,
  }: {
    geometry: DraftArea["geometry"];
    areaKm2: number;
    centroid: DraftArea["centroid"];
  }) => {
    const pricing = computePricing(geometry, areaKm2);
    setDraftArea({
      geometry,
      areaKm2,
      centroid,
      countryCode: pricing.countryCode,
      pricePerKm2: pricing.pricePerKm2,
      totalPrice: pricing.totalPrice,
    });
    pushMessage({
      type: "info",
      text: "Polygon captured. Review pricing and add your details.",
    });
  };

  const revokeImageUrl = (url?: string) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  };

  const handleImageSelected = async (file: File) => {
    if (!formState.consent) {
      pushMessage({
        type: "error",
        text: "Please check the consent box before uploading an image.",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      pushMessage({
        type: "error",
        text: "Image is larger than 5 MB. Please choose a smaller file.",
      });
      return;
    }

    let dataUrl: string;

    try {
      dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () =>
          reject(new Error("Failed to read the selected image."));
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error(error);
      pushMessage({
        type: "error",
        text: "Could not read the image. Please try a different file.",
      });
      return;
    }

    revokeImageUrl(formState.image?.objectUrl);
    const objectUrl = URL.createObjectURL(file);

    setFormState({
      ...formState,
      image: {
        dataUrl,
        objectUrl,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      },
    });
    pushMessage({
      type: "info",
      text: "Image ready. It remains on your device (localStorage only).",
    });
  };

  const handleConfirmPurchase = () => {
    if (!draftArea) {
      pushMessage({
        type: "error",
        text: "Draw an area before confirming purchase.",
      });
      return;
    }

    if (!formState.name.trim()) {
      pushMessage({
        type: "error",
        text: "Please add a name or nickname for this area.",
      });
      return;
    }

    if (formState.image && !formState.consent) {
      pushMessage({
        type: "error",
        text: "Consent is required to upload an image.",
      });
      return;
    }

    // In production, this is where we'd call the backend + payment gateway
    // before locking and persisting the polygon.
    const newArea: PurchasedArea = {
      id: nanoid(),
      geometry: draftArea.geometry,
      areaKm2: draftArea.areaKm2,
      centroid: draftArea.centroid,
      countryCode: draftArea.countryCode,
      pricePerKm2: draftArea.pricePerKm2,
      totalPrice: draftArea.totalPrice,
      name: formState.name.trim(),
      description: formState.description.trim(),
      imageDataUrl: formState.image?.dataUrl,
      imageObjectUrl: formState.image?.objectUrl,
      createdAt: new Date().toISOString(),
    };

    setPurchasedAreas((prev) => {
      const next = [...prev, newArea];
      // Storage is local-only for this demo. Replace with API persistence later.
      savePurchasedAreas(next);
      return next;
    });

    setDraftArea(null);
    setFormState(initialForm);
    setSelectedAreaId(newArea.id);
    setClearRequestId((value) => value + 1);
    pushMessage({
      type: "success",
      text: "Purchase confirmed locally. Polygon locked and saved.",
    });
  };

  const handleRemoveImageFromArea = (areaId: string) => {
    setPurchasedAreas((prev) => {
      const target = prev.find((area) => area.id === areaId);
      revokeImageUrl(target?.imageObjectUrl);
      const next = prev.map((area) =>
        area.id === areaId
          ? { ...area, imageDataUrl: undefined, imageObjectUrl: undefined }
          : area,
      );
      savePurchasedAreas(next);
      return next;
    });
  };

  const handleSelectPurchased = (areaId: string) => {
    setSelectedAreaId(areaId);
    const target = purchasedAreas.find((item) => item.id === areaId);
    if (target) {
      pushMessage({
        type: "info",
        text: `Selected "${target.name}". Details shown below.`,
      });
    }
  };

  const handleClearSelection = () => {
    revokeImageUrl(formState.image?.objectUrl);
    setDraftArea(null);
    setFormState(initialForm);
    setClearRequestId((value) => value + 1);
    pushMessage(undefined);
  };

  const confirmDisabled =
    !draftArea ||
    !formState.name.trim() ||
    (!!formState.image && !formState.consent);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 px-4 py-4 lg:flex-row">
      <div className="w-full lg:w-[370px]">
        <SidePanel
          draftArea={draftArea}
          formState={formState}
          onFormChange={setFormState}
          onDrawClick={() => setDrawRequestId((value) => value + 1)}
          onClearClick={handleClearSelection}
          onConfirm={handleConfirmPurchase}
          onImageSelected={handleImageSelected}
          onRemoveImageFromArea={handleRemoveImageFromArea}
          onSelectPurchased={handleSelectPurchased}
          onShowImage={(area) => setImageModalArea(area)}
          purchasedAreas={purchasedAreas}
          selectedArea={selectedArea}
          adminMode={adminMode}
          setAdminMode={setAdminMode}
          message={message}
          confirmDisabled={confirmDisabled}
        />
      </div>

      <div className="flex-1">
        <MapView
          purchasedAreas={purchasedAreas}
          selectedAreaId={selectedAreaId}
          drawRequestId={drawRequestId}
          clearRequestId={clearRequestId}
          onPolygonCreated={handlePolygonCreated}
          onSelectPurchased={(area) => handleSelectPurchased(area.id)}
          onError={(text) => pushMessage({ type: "error", text })}
        />
      </div>

      {imageModalArea ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {imageModalArea.name}
                </p>
                <p className="text-xs text-slate-500">
                  {imageModalArea.description}
                </p>
              </div>
              <button
                type="button"
                className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                onClick={() => setImageModalArea(null)}
              >
                Close
              </button>
            </div>
            <div className="p-4">
              {imageModalArea.imageObjectUrl || imageModalArea.imageDataUrl ? (
                <img
                  src={imageModalArea.imageObjectUrl ?? imageModalArea.imageDataUrl}
                  alt={imageModalArea.name}
                  className="max-h-[70vh] w-full rounded-lg object-contain"
                />
              ) : (
                <p className="text-sm text-slate-600">No image available.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
