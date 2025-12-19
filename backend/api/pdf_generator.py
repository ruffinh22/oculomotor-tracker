"""
Générateur de rapports PDF pour les résultats de suivi oculaire
"""

from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime


def generate_patient_report_pdf(patient, tests):
    """
    Génère un rapport PDF avec tous les résultats du patient
    
    Args:
        patient: Objet Patient
        tests: QuerySet d'EyeTrackingTest
    
    Returns:
        BytesIO contenant le PDF
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch
    )
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#000091'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#000091'),
        spaceAfter=12,
        fontName='Helvetica-Bold'
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=11,
        alignment=TA_LEFT,
        spaceAfter=6
    )
    
    # Contenu
    elements = []
    
    # Header gouvernemental
    elements.append(Paragraph(
        "Rapport de Suivi Oculaire Clinique",
        title_style
    ))
    elements.append(Paragraph(
        "Service Public Français - Système de Design de l'État",
        ParagraphStyle('subtitle', parent=styles['Normal'], fontSize=10, textColor=colors.grey, alignment=TA_CENTER)
    ))
    elements.append(Spacer(1, 0.3*inch))
    
    # Informations du patient
    elements.append(Paragraph("INFORMATIONS DU PATIENT", heading_style))
    patient_data = [
        ['Nom et Prénom:', f"{patient.user.first_name} {patient.user.last_name}"],
        ['Email:', patient.user.email],
        ['Âge:', str(patient.age) if patient.age else 'Non spécifié'],
        ['Date de rapport:', datetime.now().strftime('%d/%m/%Y à %H:%M')],
    ]
    
    patient_table = Table(patient_data, colWidths=[2*inch, 3*inch])
    patient_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ]))
    elements.append(patient_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Résumé des tests
    elements.append(Paragraph("HISTORIQUE DES TESTS", heading_style))
    
    if tests:
        test_data = [['Date', 'Durée (s)', 'Stabilité', 'Résultat', 'Évaluation']]
        
        for test in tests:
            test_data.append([
                test.created_at.strftime('%d/%m/%Y %H:%M'),
                str(test.duration_seconds or 0),
                f"{test.gaze_stability:.1f}%",
                test.result.upper(),
                test.clinical_evaluation or 'N/A'
            ])
        
        # Créer le tableau des tests
        test_table = Table(test_data, colWidths=[1.5*inch, 1.2*inch, 1.3*inch, 1.0*inch, 1.5*inch])
        test_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#000091')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')]),
        ]))
        elements.append(test_table)
    else:
        elements.append(Paragraph(
            "Aucun test enregistré pour ce patient.",
            normal_style
        ))
    
    elements.append(Spacer(1, 0.3*inch))
    
    # Footer
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph(
        "<i>Ce rapport a été généré automatiquement par le système de suivi oculaire clinique. "
        "Pour toute question, veuillez contacter le service compétent.</i>",
        ParagraphStyle('footer', parent=styles['Normal'], fontSize=9, textColor=colors.grey, alignment=TA_CENTER)
    ))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer


def generate_test_report_pdf(patient, test):
    """
    Génère un rapport PDF détaillé pour un test spécifique
    
    Args:
        patient: Objet Patient
        test: Objet EyeTrackingTest
    
    Returns:
        BytesIO contenant le PDF
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.HexColor('#000091'),
        spaceAfter=20,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.HexColor('#000091'),
        spaceAfter=10,
        fontName='Helvetica-Bold'
    )
    
    elements = []
    
    # Header
    elements.append(Paragraph("RÉSULTAT DÉTAILLÉ DU TEST", title_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # Info patient et test
    info_data = [
        ['Patient:', f"{patient.user.first_name} {patient.user.last_name}"],
        ['Date du test:', test.created_at.strftime('%d/%m/%Y à %H:%M:%S')],
        ['Durée:', f"{test.duration_seconds} secondes" if test.duration_seconds else 'N/A'],
        ['Résultat:', test.result.upper()],
    ]
    
    info_table = Table(info_data, colWidths=[1.5*inch, 3.5*inch])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # Métriques
    elements.append(Paragraph("MÉTRIQUES DE SUIVI", heading_style))
    metrics_data = [
        ['Stabilité du regard:', f"{test.gaze_stability}%"],
        ['Cohérence du regard:', f"{test.gaze_consistency}%"],
        ['Pourcentage de suivi:', f"{test.tracking_percentage}%"],
        ['Oeil gauche ouvert:', 'Oui' if test.left_eye_open else 'Non'],
        ['Oeil droit ouvert:', 'Oui' if test.right_eye_open else 'Non'],
    ]
    
    metrics_table = Table(metrics_data, colWidths=[2.5*inch, 2.5*inch])
    metrics_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(metrics_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # Évaluation clinique
    elements.append(Paragraph("ÉVALUATION CLINIQUE", heading_style))
    elements.append(Paragraph(
        test.clinical_evaluation or "Évaluation en attente",
        ParagraphStyle('body', parent=styles['Normal'], fontSize=11)
    ))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer
