'use client';

import React, { useRef, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import type { Citizen } from '@/services/database';

interface HealthCardProps {
  citizen: Citizen;
  wardName: string;
  compact?: boolean;
}

// ─── ID-1 Standard Card: 85.60 × 53.98 mm (ISO/IEC 7810)

export default function HealthCard({ citizen, wardName, compact = false }: HealthCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // REAL PVC SIZE (in mm)
  const CARD_WIDTH_MM = 85.6;
  const CARD_HEIGHT_MM = 54;

  // Convert mm → px for screen (1mm ≈ 3.78px)
  const MM_TO_PX = 3.78;

  const cardWidthPx = CARD_WIDTH_MM * MM_TO_PX;
  const cardHeightPx = CARD_HEIGHT_MM * MM_TO_PX;

  // QR size: ~17% of card width
  const qrSize = cardWidthPx * 0.17;

  /* ── Verification URL for QR ── */
  const verificationUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/citizen/${citizen.citizen_id}/verify`
      : `/citizen/${citizen.citizen_id}/verify`;

  /* ── Age ── */
  const calculateAge = (): number | null => {
    if (citizen.date_of_birth) {
      const dob = new Date(citizen.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      if (
        today.getMonth() < dob.getMonth() ||
        (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
      )
        age--;
      return age;
    }
    return citizen.age ?? null;
  };

  const age = calculateAge();

  const issueDate = citizen.created_at
    ? new Date(citizen.created_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const printDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  /* ── Get avatar image based on gender ── */
  const getAvatarImage = (): string => {
    if (citizen.gender === 'Male') {
      return '/male-avatar.jpg';
    } else if (citizen.gender === 'Female') {
      return '/female-avatar.jpg';
    }
    return '/male-avatar.jpg';
  };

  /* ─────────────────────────────────────────────────────────────
     PDF DOWNLOAD - Using html-to-image
  ───────────────────────────────────────────────────────────── */
  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    setDownloadError(null);

    try {
      const { toPng } = await import('html-to-image');

      const cardElement = cardRef.current;
      const cardW = cardElement.offsetWidth;
      const cardH = cardElement.offsetHeight;

      const dataUrl = await toPng(cardElement, {
        width: cardW,
        height: cardH,
        pixelRatio: 6,
        backgroundColor: '#ffffff',
        cacheBust: true,
        includeQueryParams: true,
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [86, 54],
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, 85.6, 54, undefined, 'FAST');
      pdf.save(`HealthCard_${citizen.citizen_id}.pdf`);

    } catch (err) {
      console.error('PDF download error:', err);
      setDownloadError('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  }, [citizen.citizen_id]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif",
      }}
    >
      {/* ═══════════════════════════════════════
          THE CARD  (ID-1 Standard: 86 × 54 mm)
      ══════════════════════════════════════════ */}
      <div
        ref={cardRef}
        data-health-card="true"
        style={{
          width: `${cardWidthPx}px`,
          height: `${cardHeightPx}px`,
          padding: '0.5mm',
          boxSizing: 'border-box',
          background: 'linear-gradient(135deg, #fff7ed 0%, #fffbeb 42%, #ecfdf5 100%)',
          borderRadius: '18px',
          boxShadow: '0 12px 30px rgba(28, 25, 23, 0.18)',
          border: '1px solid #d6b46a',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Subtle background watermark ── */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-30deg)',
            fontSize: `${cardWidthPx * 0.09}px`,
            fontWeight: 900,
            color: 'rgba(4, 120, 87, 0.055)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
            letterSpacing: '3px',
          }}
        >
          HEALTH CARD
        </div>

        {/* ══ HEADER ══ */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '5px 10px',
            background: 'linear-gradient(110deg, #064e3b 0%, #0f766e 58%, #b45309 100%)',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          {/* Logo */}
          <img
            src="/health-logo.png"
            alt="Hospital Portal"
            crossOrigin="anonymous"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '12px',
              border: '2px solid rgba(254, 243, 199, 0.75)',
              background: '#fffbeb',
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />

          {/* Title */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div
              style={{
                color: '#ffffff',
                fontSize: `${cardWidthPx * 0.038}px`,
                fontWeight: 700,
                lineHeight: 1.1,
              }}
            >
              Hospital Management Portal
            </div>
            <div
              style={{
                color: '#fde68a',
                fontSize: `${cardWidthPx * 0.026}px`,
                fontWeight: 600,
                marginTop: '1px',
              }}
            >
              Citizen Health Card
            </div>
          </div>
        </div>

        {/* ══ STRIPE ══ */}
        <div style={{ display: 'flex', height: '2px', flexShrink: 0 }}>
          <div style={{ flex: 3, background: '#047857' }} />
          <div style={{ flex: 1, background: '#d97706' }} />
        </div>

        {/* ══ BODY - 3 Column Grid ══ */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '23% 50% 27%',
            gap: '5px',
            padding: '5px 8px',
            alignItems: 'center',
          }}
        >
          {/* Photo Column - Vertically Centered */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}>
            {citizen.user_photo_url ? (
              <img
                src={citizen.user_photo_url}
                alt="Photo"
                crossOrigin="anonymous"
                style={{
                  width: '100%',
                  aspectRatio: '4/5',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  border: '1px solid #94a3b8',
                }}
              />
            ) : (
              <img
                src={getAvatarImage()}
                alt={`${citizen.gender || 'Citizen'} Avatar`}
                crossOrigin="anonymous"
                style={{
                  width: '100%',
                  aspectRatio: '4/5',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  border: '1px solid #94a3b8',
                }}
              />
            )}
          </div>

          {/* Details Column */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            justifyContent: 'center',
          }}>
            {/* Name */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{
                color: '#047857',
                fontSize: `${cardWidthPx * 0.027}px`,
                fontWeight: 600,
                minWidth: `${cardWidthPx * 0.12}px`,
              }}>
                Name:
              </span>
              <span style={{
                color: '#1f2937',
                fontSize: `${cardWidthPx * 0.032}px`,
                fontWeight: 700,
              }}>
                {citizen.name || 'N/A'}
              </span>
            </div>

            {/* Age / Gender */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{
                color: '#047857',
                fontSize: `${cardWidthPx * 0.027}px`,
                fontWeight: 600,
                minWidth: `${cardWidthPx * 0.12}px`,
              }}>
                Age/Gender:
              </span>
              <span style={{
                color: '#374151',
                fontSize: `${cardWidthPx * 0.029}px`,
              }}>
                {age ?? 'N/A'} / {citizen.gender?.charAt(0) || '?'}
              </span>
            </div>

            {/* Blood Group */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{
                color: '#047857',
                fontSize: `${cardWidthPx * 0.027}px`,
                fontWeight: 600,
                minWidth: `${cardWidthPx * 0.12}px`,
              }}>
                Blood:
              </span>
              <span style={{
                color: '#374151',
                fontSize: `${cardWidthPx * 0.029}px`,
              }}>
                {citizen.blood_group || 'N/A'}
              </span>
            </div>

            {/* Ward */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{
                color: '#047857',
                fontSize: `${cardWidthPx * 0.027}px`,
                fontWeight: 600,
                minWidth: `${cardWidthPx * 0.12}px`,
              }}>
                Ward:
              </span>
              <span style={{
                color: '#374151',
                fontSize: `${cardWidthPx * 0.029}px`,
              }}>
                {wardName}
              </span>
            </div>

            {/* Health ID */}
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '4px',
              marginTop: '2px',
              background: 'rgba(4, 120, 87, 0.10)',
              borderRadius: '8px',
              padding: '2px 5px',
            }}>
              <span style={{
                color: '#047857',
                fontSize: `${cardWidthPx * 0.027}px`,
                fontWeight: 700,
              }}>
                Health ID:
              </span>
              <span style={{
                color: '#065f46',
                fontSize: `${cardWidthPx * 0.028}px`,
                fontWeight: 800,
                fontFamily: "'Courier New', monospace",
              }}>
                {citizen.citizen_id}
              </span>
            </div>

            {/* Issue Date */}
            <div style={{ marginTop: '2px' }}>
              <span style={{
                fontSize: `${cardWidthPx * 0.022}px`,
                color: '#64748b',
              }}>
                Issue: {issueDate}
              </span>
            </div>
          </div>

          {/* QR Code Column */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            height: '100%',
          }}>
            <div
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                padding: '3px',
                background: '#ffffff',
              }}
            >
              <QRCodeSVG
                value={verificationUrl}
                size={qrSize}
                level="M"
              />
            </div>
            <span
              style={{
                fontSize: `${cardWidthPx * 0.02}px`,
                color: '#64748b',
                textAlign: 'center',
                lineHeight: 1.2,
                fontWeight: 500,
              }}
            >
              Scan for Records
            </span>
          </div>
        </div>

        {/* ══ FOOTER STRIPE ══ */}
        <div style={{ display: 'flex', height: '2px', flexShrink: 0 }}>
          <div style={{ flex: 1, background: '#047857' }} />
          <div style={{ flex: 1, background: '#d97706' }} />
          <div style={{ flex: 1, background: '#047857' }} />
        </div>

        {/* ══ FOOTER ══ */}
        <div
          style={{
            background: 'linear-gradient(110deg, #064e3b 0%, #0f766e 58%, #b45309 100%)',
            padding: '4px 10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{
            fontSize: `${cardWidthPx * 0.02}px`,
            color: 'rgba(255, 255, 255, 0.85)',
            fontWeight: 500,
          }}>
            Print: {printDate}
          </span>
          <span
            style={{
              fontSize: `${cardWidthPx * 0.018}px`,
              color: 'rgba(255, 255, 255, 0.7)',
              fontStyle: 'italic',
              textAlign: 'right',
            }}
          >
            Scan QR for health records
          </span>
        </div>
      </div>

      {/* ══ DOWNLOAD BUTTON ══ */}
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 24px',
          background: isDownloading ? '#a8a29e' : 'linear-gradient(90deg, #047857, #d97706)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '999px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: isDownloading ? 'not-allowed' : 'pointer',
          boxShadow: isDownloading ? 'none' : '0 8px 18px rgba(4, 120, 87, 0.28)',
          transition: 'background-color 0.2s',
        }}
      >
        {isDownloading ? (
          <>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
            Generating PDF...
          </>
        ) : (
          <>⬇ Download Health Card (PDF)</>
        )}
      </button>

      {downloadError && (
        <p style={{ color: '#dc2626', fontSize: '13px', margin: 0, textAlign: 'center' }}>
          {downloadError}
        </p>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
