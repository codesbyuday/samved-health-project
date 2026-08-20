import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AppointmentSlipData {
  appointment_id: string;
  citizen_id: string;
  citizen_name: string;
  citizen_phone: string;
  citizen_gender: string;
  citizen_address: string;
  doctor_name: string;
  doctor_specialization: string;
  hospital_name: string;
  hospital_address: string;
  hospital_contact: string;
  department_name: string;
  appointment_date: string;
  time_slot: string;
  token_id: number | null;
  appointment_type: string;
  status: string;
  created_at: string;
}

function safeValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  return String(value);
}

function formatDate(value: string) {
  if (!value || value === "N/A") {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

async function getAppointmentData(appointmentId: string): Promise<AppointmentSlipData | null> {
  try {
    const { apiClient } = await import("@/services/apiClient");
    const res = await apiClient.get<any[]>(`/appointments`);
    const appointments = res.data || [];
    const appointment = appointments.find((a: any) => a.appointment_id === appointmentId);

    if (!appointment) {
      return null;
    }

    const citizen = appointment.citizens || {};
    const hospital = appointment.hospitals || {};
    const hospitalWard = appointment.hospital_wards || {};

    return {
      appointment_id: safeValue(appointment.appointment_id),
      citizen_id: safeValue(appointment.citizen_id),
      citizen_name: safeValue(citizen.name),
      citizen_phone: safeValue(citizen.phone),
      citizen_gender: safeValue(citizen.gender),
      citizen_address: safeValue(citizen.address),
      doctor_name: safeValue(appointment.doctor_id || "Duty Medical Officer"),
      doctor_specialization: "General Medicine",
      hospital_name: safeValue(hospital.name || "Surat Civil Hospital"),
      hospital_address: safeValue(hospital.address || "Surat, Gujarat"),
      hospital_contact: safeValue(hospital.contact_number || "0261-2244111"),
      department_name: safeValue(hospitalWard.ward_name || "General Ward"),
      appointment_date: safeValue(appointment.appointment_date),
      time_slot: safeValue(appointment.time_slot),
      token_id: appointment.token_id || 1,
      appointment_type: safeValue(appointment.appointment_type).replaceAll("_", " "),
      status: safeValue(appointment.status),
      created_at: safeValue(appointment.created_at),
    };
  } catch (error) {
    console.error("Error in getAppointmentData:", error);
    return null;
  }
}

function addSection(
  doc: jsPDF,
  title: string,
  rows: Array<[string, string]>,
  startY: number
) {
  let y = startY;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 136, 229);
  doc.text(title, 15, y);
  y += 6;

  doc.setFontSize(10);

  rows.forEach(([label, value]) => {
    const valueLines = doc.splitTextToSize(value, 130);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(85, 85, 85);
    doc.text(`${label}:`, 15, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 20, 20);
    doc.text(valueLines, 48, y);

    y += Math.max(6, valueLines.length * 5);
  });

  return y + 2;
}

function generatePdfBuffer(data: AppointmentSlipData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(17, 24, 39);
  doc.text("APPOINTMENT SLIP", 105, 18, { align: "center" });

  if (data.token_id !== null) {
    doc.setFontSize(20);
    doc.setTextColor(30, 136, 229);
    doc.text(`Token No: #${data.token_id}`, 105, 30, { align: "center" });
  }

  let y = 42;

  y = addSection(
    doc,
    "Patient Information",
    [
      ["Name", data.citizen_name],
      ["Citizen ID", data.citizen_id],
      ["Phone", data.citizen_phone],
      ["Gender", data.citizen_gender],
      ["Address", data.citizen_address],
    ],
    y
  );

  y = addSection(
    doc,
    "Doctor & Department",
    [
      ["Doctor", data.doctor_name],
      ["Specialization", data.doctor_specialization],
      ["Department", data.department_name],
    ],
    y
  );

  y = addSection(
    doc,
    "Hospital Details",
    [
      ["Hospital", data.hospital_name],
      ["Address", data.hospital_address],
      ["Contact", data.hospital_contact],
    ],
    y
  );

  addSection(
    doc,
    "Appointment Details",
    [
      ["Date", formatDate(data.appointment_date)],
      ["Time Slot", data.time_slot],
      ["Type", data.appointment_type],
      ["Status", data.status.toUpperCase()],
      ["Appointment ID", data.appointment_id],
    ],
    y
  );

  doc.setDrawColor(203, 213, 225);
  doc.line(15, 270, 195, 270);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "This is a computer-generated appointment slip. Please arrive 15 minutes before your appointment time.",
    105,
    277,
    { align: "center", maxWidth: 180 }
  );
  doc.text(
    `Generated on ${new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date())}`,
    105,
    284,
    { align: "center" }
  );

  return Buffer.from(doc.output("arraybuffer"));
}

export async function GET(request: NextRequest) {
  try {
    const appointmentId = request.nextUrl.searchParams.get("appointment_id");

    if (!appointmentId) {
      return NextResponse.json({ error: "Appointment ID is required" }, { status: 400 });
    }

    const appointmentData = await getAppointmentData(appointmentId);

    if (!appointmentData) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const pdfBuffer = generatePdfBuffer(appointmentData);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="appointment_slip_${appointmentId}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generating appointment slip:", error);

    return NextResponse.json(
      {
        error: "Failed to generate appointment slip",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
