/**
 * @fileoverview Utilidad para generar PDFs de nómina
 * Genera un PDF profesional con los detalles de la colilla de pago
 */

import jsPDF from 'jspdf';

/**
 * Formatea un valor numérico como moneda colombiana
 * @param {number} value - Valor a formatear
 * @returns {string} Valor formateado como moneda
 */
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * Genera un PDF con los detalles de la nómina
 * @param {Object} payroll - Objeto con los datos de la nómina
 * @param {string} payroll.empleado_nombre - Nombre del empleado
 * @param {string} payroll.empleado_doc - Documento del empleado
 * @param {string} payroll.periodo_pago - Período de pago
 * @param {string} payroll.fecha_generacion - Fecha de generación
 * @param {Array} payroll.details - Array de conceptos de la nómina
 * @param {number} payroll.total_accrued - Total devengado
 * @param {number} payroll.total_deducted - Total deducido
 * @param {number} payroll.net_pay - Neto a pagar
 * @param {string} payroll.observaciones - Observaciones (opcional)
 */
export const generatePayrollPDF = (payroll) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;
  const margin = 15;
  const maxWidth = pageWidth - (margin * 2);

  // Colores en blanco y negro para impresión
  const blackColor = [0, 0, 0];
  const grayColor = [100, 100, 100]; // Gris para textos secundarios

  // Función auxiliar para agregar texto con wrap
  const addText = (text, x, y, options = {}) => {
    const {
      fontSize = 10,
      fontStyle = 'normal',
      color = [0, 0, 0],
      align = 'left',
      maxWidth: textMaxWidth = maxWidth
    } = options;

    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.setTextColor(...color);

    const lines = doc.splitTextToSize(text, textMaxWidth);
    doc.text(lines, x, y, { align });
    return lines.length * (fontSize * 0.35); // Retorna la altura usada
  };

  // Encabezado
  doc.setFillColor(0, 0, 0); // Negro para impresión
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('COLILLA DE PAGO', pageWidth / 2, 25, { align: 'center' });

  yPosition = 50;

  // Información del empleado y período
  doc.setTextColor(...grayColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('INFORMACIÓN DEL EMPLEADO', margin, yPosition);
  yPosition += 8;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  const empleadoInfo = [
    `Empleado: ${payroll.empleado_nombre || 'N/A'}`,
    `Documento: ${payroll.empleado_doc || 'N/A'}`,
    `Período de Pago: ${payroll.periodo_pago ? payroll.periodo_pago.split('T')[0] : 'N/A'}`,
    `Fecha de Generación: ${new Date(payroll.fecha_generacion).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`
  ];

  empleadoInfo.forEach((info, index) => {
    const xPos = index % 2 === 0 ? margin : pageWidth / 2;
    if (index % 2 === 0 && index > 0) yPosition += 6;
    doc.text(info, xPos, yPosition);
  });
  yPosition += 15;

  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Tabla de conceptos
  doc.setTextColor(...grayColor);
  doc.setFontSize(8);
  doc.text('CONCEPTOS DE PAGO', margin, yPosition);
  yPosition += 8;

  // Encabezados de la tabla - Calcular posiciones X correctamente
  doc.setFillColor(240, 240, 240); // Gris claro para fondo
  doc.rect(margin, yPosition - 5, pageWidth - (margin * 2), 8, 'F');
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  // Anchos de columna ajustados para mejor alineación
  // Total disponible: pageWidth - (margin * 2) ≈ 180mm
  // Distribución: Concepto (más ancho) + Cantidad (pequeño) + 3 columnas numéricas (iguales)
  const availableWidth = pageWidth - (margin * 2) - 4; // Restar padding adicional
  const colWidths = [
    availableWidth * 0.40,  // Concepto: 40%
    availableWidth * 0.12,  // Cantidad: 12%
    availableWidth * 0.16,  // Valor Unitario: 16%
    availableWidth * 0.16,  // Devengado: 16%
    availableWidth * 0.16   // Deducido: 16%
  ];
  const headers = ['Concepto', 'Cant.', 'Valor Unit.', 'Devengado', 'Deducido'];
  
  // Calcular posiciones X de inicio de cada columna
  const colPositions = [margin + 2]; // Primera columna con pequeño padding
  for (let i = 1; i < colWidths.length; i++) {
    colPositions.push(colPositions[i - 1] + colWidths[i - 1]);
  }
  
  // Dibujar encabezados con alineación correcta
  headers.forEach((header, index) => {
    let align = 'left';
    let xPos = colPositions[index];
    
    if (index === 1) {
      // Cantidad: centrado
      align = 'center';
      xPos = colPositions[index] + (colWidths[index] / 2);
    } else if (index > 1) {
      // Valores numéricos: alineados a la derecha
      align = 'right';
      xPos = colPositions[index] + colWidths[index] - 2;
    } else {
      // Concepto: alineado a la izquierda con padding
      xPos = colPositions[index] + 2;
    }
    
    doc.text(header, xPos, yPosition, { align });
  });
  
  yPosition += 8;
  doc.setDrawColor(0, 0, 0); // Línea negra
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  // Filas de conceptos
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0); // Todo en negro
  
  if (payroll.details && Array.isArray(payroll.details)) {
    payroll.details.forEach((detail, index) => {
      // Verificar si necesitamos una nueva página
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      // Concepto - alineado a la izquierda (misma posición que el encabezado)
      const conceptLines = doc.splitTextToSize(detail.concept || 'N/A', colWidths[0] - 4);
      doc.text(conceptLines, colPositions[0] + 2, yPosition, { align: 'left' });
      
      // Cantidad - centrado (misma posición que el encabezado)
      const cantidadText = String(detail.quantity || 0);
      doc.text(cantidadText, colPositions[1] + (colWidths[1] / 2), yPosition, { align: 'center' });
      
      // Valor Unitario - alineado a la derecha (misma posición que el encabezado)
      doc.text(formatCurrency(detail.unitValue || 0), colPositions[2] + colWidths[2] - 2, yPosition, { align: 'right' });
      
      // Devengado - alineado a la derecha, siempre en negro (misma posición que el encabezado)
      if (detail.accrued > 0) {
        doc.text(formatCurrency(detail.accrued), colPositions[3] + colWidths[3] - 2, yPosition, { align: 'right' });
      } else {
        doc.text('-', colPositions[3] + colWidths[3] - 2, yPosition, { align: 'right' });
      }
      
      // Deducido - alineado a la derecha, siempre en negro (misma posición que el encabezado)
      if (detail.deducted > 0) {
        doc.text(formatCurrency(detail.deducted), colPositions[4] + colWidths[4] - 2, yPosition, { align: 'right' });
      } else {
        doc.text('-', colPositions[4] + colWidths[4] - 2, yPosition, { align: 'right' });
      }
      
      // Calcular altura de la fila basada en el concepto (puede tener múltiples líneas)
      const rowHeight = Math.max(6, conceptLines.length * 4);
      yPosition += rowHeight;
      
      // Línea separadora entre filas
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(margin, yPosition - 1, pageWidth - margin, yPosition - 1);
      yPosition += 2;
    });
  }

  // Totales
  yPosition += 5;
  if (yPosition > pageHeight - 70) {
    doc.addPage();
    yPosition = 20;
  }

  // Calcular altura necesaria para el recuadro
  // Espaciado: 5 (top padding) + 7 (línea 1) + 7 (línea 2) + 2 (línea separadora) + 7 (línea 3) + 5 (bottom padding) = 33
  const totalBoxHeight = 33;
  const boxTop = yPosition - 5;
  
  doc.setFillColor(240, 240, 240); // Gris claro para fondo
  doc.rect(margin, boxTop, pageWidth - (margin * 2), totalBoxHeight, 'F');
  
  doc.setDrawColor(0, 0, 0); // Borde negro
  doc.setLineWidth(0.5);
  doc.rect(margin, boxTop, pageWidth - (margin * 2), totalBoxHeight);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal'); // Sin negrita
  doc.setTextColor(0, 0, 0); // Todo en negro

  // Total Devengado - alineado dentro del recuadro
  const line1Y = boxTop + 7;
  doc.text('Total Devengado:', margin + 5, line1Y);
  doc.text(formatCurrency(payroll.total_accrued), pageWidth - margin - 5, line1Y, { align: 'right' });

  // Total Deducido - alineado dentro del recuadro
  const line2Y = boxTop + 14;
  doc.text('Total Deducido:', margin + 5, line2Y);
  doc.text(formatCurrency(payroll.total_deducted), pageWidth - margin - 5, line2Y, { align: 'right' });

  // Línea separadora antes del Neto a Pagar
  const separatorY = boxTop + 20;
  doc.setDrawColor(0, 0, 0); // Línea negra
  doc.setLineWidth(0.5);
  doc.line(margin + 5, separatorY, pageWidth - margin - 5, separatorY);
  
  // Neto a Pagar - mismo tamaño y sin negrita, alineado dentro del recuadro
  const line3Y = boxTop + 27;
  doc.setFontSize(10); // Mismo tamaño que los otros totales
  doc.setFont('helvetica', 'normal'); // Sin negrita
  doc.setTextColor(0, 0, 0); // Negro
  doc.text('Neto a Pagar:', margin + 5, line3Y);
  doc.text(formatCurrency(payroll.net_pay), pageWidth - margin - 5, line3Y, { align: 'right' });

  // Observaciones
  if (payroll.observaciones) {
    yPosition += 35;
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...grayColor);
    doc.text('OBSERVACIONES:', margin, yPosition);
    yPosition += 6;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const observacionesLines = doc.splitTextToSize(payroll.observaciones, maxWidth);
    doc.text(observacionesLines, margin, yPosition);
  }

  // Pie de página
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `Página ${i} de ${totalPages} - Generado el ${new Date().toLocaleDateString('es-ES')}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Generar nombre del archivo
  const empleadoName = (payroll.empleado_nombre || 'empleado').replace(/\s+/g, '_');
  const periodo = payroll.periodo_pago ? payroll.periodo_pago.split('T')[0] : 'sin_periodo';
  const fileName = `Nomina_${empleadoName}_${periodo}.pdf`;

  // Guardar el PDF
  doc.save(fileName);
};

