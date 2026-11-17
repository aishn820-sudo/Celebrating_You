"use client";

import { useState } from "react";
import { Share2, Copy, Check, MessageSquare, ExternalLink, QrCode } from "lucide-react";
import Button from "@/components/ui/Button";

export default function VendorMarketingCard({
  vendorCode,
  businessName,
  vendorId,
}: {
  vendorCode: string;
  businessName: string;
  vendorId: string;
}) {
  const [copied, setCopied] = useState(false);

  // Direct marketing URL
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const directLink = `${origin}/explore?search=${encodeURIComponent(businessName)}&ref=${vendorCode}`;
  const whatsappText = encodeURIComponent(
    `Namaste! Book ${businessName} for your upcoming celebration on Celebrating YOU with guaranteed 2-hour confirmation: ${directLink}`
  );
  const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappText}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(directLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-soft mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-rose-700" />
            <span className="font-serif font-bold text-stone-900 text-base">
              Artisan Marketing & Direct Booking Link
            </span>
          </div>
          <p className="text-xs text-stone-600 mt-1">
            Share your direct marketplace storefront with clients on WhatsApp, Instagram bio, or wedding cards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="text-xs gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy Link"}
          </Button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Share on WhatsApp
          </a>
        </div>
      </div>

      <div className="p-3 bg-warm-50 rounded-xl border border-stone-200/80 flex items-center justify-between gap-3 text-xs">
        <span className="font-mono text-stone-700 truncate select-all">{directLink}</span>
        <a
          href={directLink}
          target="_blank"
          rel="noreferrer"
          className="text-rose-700 hover:text-rose-800 font-semibold shrink-0 flex items-center gap-1"
        >
          Preview Storefront <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

