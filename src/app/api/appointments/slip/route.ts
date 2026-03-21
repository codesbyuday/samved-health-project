import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, unlink } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

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

async function getAppointmentData(appointmentId: string): Promise<AppointmentSlipData | null> {
  try {
    // Fetch appointment with all related data
    const { data: appointment, error: aptError } = await supabase
      .from('appointments')
      .select(`
        *,
        citizens (*),
        hospitals (*),
        hospital_wards (*)
      `)
      .eq('appointment_id', appointmentId)
      .single();

    if (aptError || !appointment) {
      console.error('Error fetching appointment:', aptError);
      return null;
    }

    // Fetch doctor info from hospital_staff using doctor_id (staff_uuid)
    let doctorData = null;
    if (appointment.doctor_id) {
      // First try to get from doctors table
      const { data: doctor, error: docError } = await supabase
        .from('doctors')
        .select(`
          *,
          hospital_staff (*)
        `)
        .eq('staff_uuid', appointment.doctor_id)
        .single();

      if (!docError && doctor?.hospital_staff) {
        doctorData = {
          name: (doctor.hospital_staff as Record<string, unknown>)?.name || 'N/A',
          specialization: doctor.specialization || 'N/A'
        };
      } else {
        // Fallback: fetch directly from hospital_staff
        const { data: staff, error: staffError } = await supabase
          .from('hospital_staff')
          .select('*')
          .eq('staff_uuid', appointment.doctor_id)
          .single();

        if (!staffError && staff) {
          doctorData = {
            name: staff.name || 'N/A',
            specialization: staff.department || 'N/A'
          };
        }
      }
    }

    const citizen = appointment.citizens as Record<string, unknown>;
    const hospital = appointment.hospitals as Record<string, unknown>;
    const hospitalWard = appointment.hospital_wards as Record<string, unknown>;

    return {
      appointment_id: appointment.appointment_id || 'N/A',
      citizen_id: appointment.citizen_id || 'N/A',
      citizen_name: (citizen?.name as string) || 'N/A',
      citizen_phone: (citizen?.phone as string) || 'N/A',
      citizen_gender: (citizen?.gender as string) || 'N/A',
      citizen_address: (citizen?.address as string) || 'N/A',
      doctor_name: doctorData?.name || 'N/A',
      doctor_specialization: doctorData?.specialization || 'N/A',
      hospital_name: (hospital?.name as string) || 'N/A',
      hospital_address: (hospital?.address as string) || 'N/A',
      hospital_contact: (hospital?.contact_number as string) || 'N/A',
      department_name: (hospitalWard?.ward_name as string) || 'N/A',
      appointment_date: appointment.appointment_date || 'N/A',
      time_slot: appointment.time_slot || 'N/A',
      token_id: appointment.token_id,
      appointment_type: appointment.appointment_type || 'in_person',
      status: appointment.status || 'booked',
      created_at: appointment.created_at || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in getAppointmentData:', error);
    return null;
  }
}

function generatePythonScript(data: AppointmentSlipData, outputPath: string): string {
  return `
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# Register fonts
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')

# Create document with compact margins
doc = SimpleDocTemplate(
    "${outputPath}",
    pagesize=A4,
    rightMargin=1*cm,
    leftMargin=1*cm,
    topMargin=1*cm,
    bottomMargin=0.8*cm
)

# Styles - Compact versions
title_style = ParagraphStyle(
    'TitleStyle',
    fontName='Times New Roman',
    fontSize=16,
    leading=18,
    alignment=TA_CENTER,
    spaceAfter=4
)

header_style = ParagraphStyle(
    'HeaderStyle',
    fontName='Times New Roman',
    fontSize=11,
    leading=13,
    alignment=TA_LEFT,
    textColor=colors.HexColor('#1E88E5'),
    spaceBefore=6,
    spaceAfter=3
)

label_style = ParagraphStyle(
    'LabelStyle',
    fontName='Times New Roman',
    fontSize=9,
    leading=11,
    textColor=colors.HexColor('#555555')
)

value_style = ParagraphStyle(
    'ValueStyle',
    fontName='Times New Roman',
    fontSize=9,
    leading=11,
    textColor=colors.black
)

token_style = ParagraphStyle(
    'TokenStyle',
    fontName='Times New Roman',
    fontSize=24,
    leading=26,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#1E88E5')
)

footer_style = ParagraphStyle(
    'FooterStyle',
    fontName='Times New Roman',
    fontSize=8,
    leading=10,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#888888')
)

# Build story
story = []

# Title - APPOINTMENT SLIP only
story.append(Paragraph("<b>APPOINTMENT SLIP</b>", title_style))
story.append(Spacer(1, 4))

# Token Number (prominent but smaller)
if '${data.token_id}' and '${data.token_id}' != 'None':
    story.append(Paragraph("<b>Token No: #${data.token_id || 'N/A'}</b>", token_style))
    story.append(Spacer(1, 8))

# Patient Information Section
story.append(Paragraph("<b>Patient Information</b>", header_style))

patient_data = [
    [Paragraph("<b>Name:</b>", label_style), Paragraph("${data.citizen_name}", value_style)],
    [Paragraph("<b>Citizen ID:</b>", label_style), Paragraph("${data.citizen_id}", value_style)],
    [Paragraph("<b>Phone:</b>", label_style), Paragraph("${data.citizen_phone}", value_style)],
    [Paragraph("<b>Gender:</b>", label_style), Paragraph("${data.citizen_gender}", value_style)],
    [Paragraph("<b>Address:</b>", label_style), Paragraph("${data.citizen_address}", value_style)],
]

patient_table = Table(patient_data, colWidths=[2.5*cm, 14.5*cm])
patient_table.setStyle(TableStyle([
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('LEFTPADDING', (0, 0), (-1, -1), 0),
    ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ('TOPPADDING', (0, 0), (-1, -1), 2),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
]))
story.append(patient_table)
story.append(Spacer(1, 6))

# Doctor Information Section
story.append(Paragraph("<b>Doctor & Department</b>", header_style))

doctor_data = [
    [Paragraph("<b>Doctor:</b>", label_style), Paragraph("${data.doctor_name}", value_style)],
    [Paragraph("<b>Specialization:</b>", label_style), Paragraph("${data.doctor_specialization}", value_style)],
    [Paragraph("<b>Department:</b>", label_style), Paragraph("${data.department_name}", value_style)],
]

doctor_table = Table(doctor_data, colWidths=[2.5*cm, 14.5*cm])
doctor_table.setStyle(TableStyle([
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('LEFTPADDING', (0, 0), (-1, -1), 0),
    ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ('TOPPADDING', (0, 0), (-1, -1), 2),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
]))
story.append(doctor_table)
story.append(Spacer(1, 6))

# Hospital Information Section
story.append(Paragraph("<b>Hospital Details</b>", header_style))

hospital_data = [
    [Paragraph("<b>Hospital:</b>", label_style), Paragraph("${data.hospital_name}", value_style)],
    [Paragraph("<b>Address:</b>", label_style), Paragraph("${data.hospital_address}", value_style)],
    [Paragraph("<b>Contact:</b>", label_style), Paragraph("${data.hospital_contact}", value_style)],
]

hospital_table = Table(hospital_data, colWidths=[2.5*cm, 14.5*cm])
hospital_table.setStyle(TableStyle([
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('LEFTPADDING', (0, 0), (-1, -1), 0),
    ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ('TOPPADDING', (0, 0), (-1, -1), 2),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
]))
story.append(hospital_table)
story.append(Spacer(1, 6))

# Appointment Details Section
story.append(Paragraph("<b>Appointment Details</b>", header_style))

# Format date
appointment_date = "${data.appointment_date}"
formatted_date = appointment_date
try:
    from datetime import datetime
    dt = datetime.strptime(appointment_date, "%Y-%m-%d")
    formatted_date = dt.strftime("%B %d, %Y")
except:
    pass

# Status color
status = "${data.status}"
status_colors = {
    'booked': '#1E88E5',
    'confirmed': '#43A047',
    'cancelled': '#E53935',
    'completed': '#757575',
    'not_attended': '#FB8C00',
    'rescheduled': '#8E24AA'
}
status_color = status_colors.get(status, '#666666')

appointment_data = [
    [Paragraph("<b>Date:</b>", label_style), Paragraph(formatted_date, value_style)],
    [Paragraph("<b>Time Slot:</b>", label_style), Paragraph("${data.time_slot}", value_style)],
    [Paragraph("<b>Type:</b>", label_style), Paragraph("${data.appointment_type?.replace('_', ' ') || 'In-Person'}", value_style)],
    [Paragraph("<b>Status:</b>", label_style), Paragraph(f"<font color='{status_color}'><b>{status.upper()}</b></font>", value_style)],
    [Paragraph("<b>Appointment ID:</b>", label_style), Paragraph("${data.appointment_id}", value_style)],
]

appointment_table = Table(appointment_data, colWidths=[2.5*cm, 14.5*cm])
appointment_table.setStyle(TableStyle([
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('LEFTPADDING', (0, 0), (-1, -1), 0),
    ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ('TOPPADDING', (0, 0), (-1, -1), 2),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
]))
story.append(appointment_table)
story.append(Spacer(1, 12))

# Footer - Compact
story.append(Paragraph("_" * 80, footer_style))
story.append(Spacer(1, 3))
story.append(Paragraph("This is a computer-generated appointment slip. Please arrive 15 minutes before your appointment time.", footer_style))
story.append(Spacer(1, 2))

# Generated timestamp
from datetime import datetime
generated_at = datetime.now().strftime("%B %d, %Y at %I:%M %p")
story.append(Paragraph(f"Generated on: {generated_at}", footer_style))

# Build PDF
doc.build(story)
print(f"PDF generated successfully at: ${outputPath}")
`;
}

export async function GET(request: NextRequest) {
  try {
    const appointmentId = request.nextUrl.searchParams.get('appointment_id');
    
    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    // Get appointment data
    const appointmentData = await getAppointmentData(appointmentId);
    
    if (!appointmentData) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Generate unique filename
    const filename = `appointment_slip_${appointmentId}.pdf`;
    const outputPath = path.join('/tmp', filename);
    const pythonScript = path.join('/tmp', `generate_slip_${appointmentId}.py`);

    // Generate Python script
    const pythonCode = generatePythonScript(appointmentData, outputPath);
    
    // Write Python script to file
    const fs = require('fs');
    fs.writeFileSync(pythonScript, pythonCode);

    // Execute Python script
    try {
      const { stdout, stderr } = await execAsync(`python3 "${pythonScript}"`);
      console.log('Python output:', stdout);
      if (stderr) console.error('Python stderr:', stderr);
    } catch (execError) {
      console.error('Error executing Python script:', execError);
      return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }

    // Read the generated PDF
    const pdfBuffer = await readFile(outputPath);

    // Cleanup temp files
    try {
      await unlink(pythonScript);
      await unlink(outputPath);
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="appointment_slip_${appointmentId}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating appointment slip:', error);
    return NextResponse.json({ 
      error: 'Failed to generate appointment slip',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
