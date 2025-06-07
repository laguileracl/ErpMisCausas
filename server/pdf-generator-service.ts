import puppeteer from 'puppeteer';
import archiver from 'archiver';
import { cuentaProvisoriaService } from './cuenta-provisoria-service';
import fs from 'fs/promises';
import path from 'path';

export class PDFGeneratorService {

  // Generar HTML para el reporte de Cuenta Provisoria
  private generateCuentaProvisoriaHTML(data: {
    cuenta: any;
    legalCase: any;
    movements: any[];
    summary: any;
  }): string {
    const { cuenta, legalCase, movements, summary } = data;
    
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    const formatDate = (date: string | Date) => {
      return new Date(date).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    const monthNames = [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cuenta Provisoria - ${cuenta.rol}</title>
        <style>
            @page {
                size: A4;
                margin: 2cm 1.5cm;
            }
            
            body {
                font-family: 'Arial', sans-serif;
                font-size: 11px;
                line-height: 1.3;
                color: #000;
                margin: 0;
                padding: 0;
            }
            
            .header {
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 2px solid #000;
                padding-bottom: 10px;
            }
            
            .title {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .subtitle {
                font-size: 12px;
                margin-bottom: 3px;
            }
            
            .case-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 15px;
                padding: 10px;
                background-color: #f5f5f5;
                border: 1px solid #ddd;
            }
            
            .case-info-left, .case-info-right {
                flex: 1;
            }
            
            .case-info-right {
                text-align: right;
            }
            
            .movements-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
                font-size: 10px;
            }
            
            .movements-table th {
                background-color: #e6e6e6;
                border: 1px solid #000;
                padding: 6px 4px;
                text-align: center;
                font-weight: bold;
                font-size: 9px;
            }
            
            .movements-table td {
                border: 1px solid #000;
                padding: 4px;
                text-align: left;
                vertical-align: top;
            }
            
            .movements-table .number-cell {
                text-align: right;
                font-family: 'Courier New', monospace;
            }
            
            .movements-table .center-cell {
                text-align: center;
            }
            
            .movements-table .date-cell {
                text-align: center;
                width: 70px;
            }
            
            .summary-section {
                margin-top: 20px;
                border: 2px solid #000;
                padding: 15px;
                background-color: #f9f9f9;
            }
            
            .summary-table {
                width: 100%;
                border-collapse: collapse;
            }
            
            .summary-table td {
                padding: 8px;
                border-bottom: 1px solid #ccc;
            }
            
            .summary-table .label {
                font-weight: bold;
                width: 60%;
            }
            
            .summary-table .amount {
                text-align: right;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                width: 40%;
            }
            
            .final-balance {
                font-size: 13px;
                font-weight: bold;
                background-color: #d4edda;
                border: 2px solid #155724;
            }
            
            .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 9px;
                color: #666;
                border-top: 1px solid #ccc;
                padding-top: 10px;
            }
            
            .signature-section {
                margin-top: 30px;
                display: flex;
                justify-content: space-between;
            }
            
            .signature-box {
                width: 200px;
                text-align: center;
                border-top: 1px solid #000;
                padding-top: 5px;
                font-size: 10px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">CUENTA PROVISORIA</div>
            <div class="subtitle">ADMINISTRACIÓN DE FONDOS JUDICIALES</div>
            <div class="subtitle">Período: ${monthNames[cuenta.month - 1]} ${cuenta.year}</div>
        </div>
        
        <div class="case-info">
            <div class="case-info-left">
                <strong>ROL:</strong> ${cuenta.rol}<br>
                <strong>CAUSA:</strong> ${legalCase?.title || 'Sin título'}<br>
                <strong>DEUDOR:</strong> ${cuenta.debtorName}
            </div>
            <div class="case-info-right">
                <strong>TRIBUNAL:</strong> ${legalCase?.court || 'No especificado'}<br>
                <strong>FECHA GENERACIÓN:</strong> ${formatDate(cuenta.generatedAt)}<br>
                <strong>ESTADO:</strong> ${cuenta.status.toUpperCase()}
            </div>
        </div>
        
        <table class="movements-table">
            <thead>
                <tr>
                    <th width="8%">FECHA</th>
                    <th width="35%">CONCEPTO</th>
                    <th width="12%">DOCUMENTO</th>
                    <th width="8%">TIPO</th>
                    <th width="15%">MONTO</th>
                    <th width="15%">SALDO</th>
                    <th width="7%">N°</th>
                </tr>
            </thead>
            <tbody>
                ${movements.map((movement, index) => `
                    <tr>
                        <td class="date-cell">${formatDate(movement.date)}</td>
                        <td>${movement.description}</td>
                        <td class="center-cell">
                            ${movement.documentType ? `${movement.documentType.toUpperCase()}` : ''}
                            ${movement.documentNumber ? `<br>${movement.documentNumber}` : ''}
                        </td>
                        <td class="center-cell">
                            <strong style="color: ${movement.tipo === 'ingreso' ? '#28a745' : '#dc3545'}">
                                ${movement.tipo.toUpperCase()}
                            </strong>
                        </td>
                        <td class="number-cell">${formatCurrency(movement.amount)}</td>
                        <td class="number-cell"><strong>${formatCurrency(movement.balance)}</strong></td>
                        <td class="center-cell">${index + 1}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="summary-section">
            <h3 style="margin-top: 0; text-align: center;">RESUMEN FINANCIERO</h3>
            <table class="summary-table">
                <tr>
                    <td class="label">Saldo Período Anterior:</td>
                    <td class="amount">${formatCurrency(summary.saldoAnterior)}</td>
                </tr>
                <tr>
                    <td class="label">Total Ingresos del Período:</td>
                    <td class="amount" style="color: #28a745;">${formatCurrency(summary.totalIngresos)}</td>
                </tr>
                <tr>
                    <td class="label">Total Egresos del Período:</td>
                    <td class="amount" style="color: #dc3545;">${formatCurrency(summary.totalEgresos)}</td>
                </tr>
                <tr class="final-balance">
                    <td class="label">SALDO FINAL:</td>
                    <td class="amount">${formatCurrency(summary.saldoFinal)}</td>
                </tr>
            </table>
        </div>
        
        ${cuenta.observations ? `
        <div style="margin-top: 20px; padding: 10px; border: 1px solid #ccc; background-color: #fff3cd;">
            <strong>Observaciones:</strong><br>
            ${cuenta.observations}
        </div>
        ` : ''}
        
        <div class="signature-section">
            <div class="signature-box">
                Administrador de Fondos<br>
                <small>Firma y Timbre</small>
            </div>
            <div class="signature-box">
                Receptor Judicial<br>
                <small>Firma y Timbre</small>
            </div>
        </div>
        
        <div class="footer">
            Documento generado automáticamente por Sistema ERP MisCausas.cl<br>
            Fecha de generación: ${formatDate(new Date())} - Movimientos: ${movements.length}
        </div>
    </body>
    </html>
    `;
  }

  // Generar PDF individual
  async generateCuentaProvisoriaPDF(cuentaProvisoriaId: number): Promise<{
    buffer: Buffer;
    filename: string;
  }> {
    const data = await cuentaProvisoriaService.generatePDFData(cuentaProvisoriaId);
    const html = this.generateCuentaProvisoriaHTML(data);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = Buffer.from(await page.pdf({
        format: 'A4',
        margin: {
          top: '2cm',
          right: '1.5cm',
          bottom: '2cm',
          left: '1.5cm'
        },
        printBackground: true,
        preferCSSPageSize: true
      }));
      
      const filename = cuentaProvisoriaService.generateFileName(
        data.cuenta.rol,
        data.cuenta.debtorName,
        data.cuenta.month,
        data.cuenta.year
      );
      
      return {
        buffer: pdfBuffer,
        filename
      };
    } finally {
      await browser.close();
    }
  }

  // Generar ZIP con múltiples PDFs
  async generateMultipleCuentaProvisoriaPDFs(cuentaProvisoriaIds: number[]): Promise<{
    buffer: Buffer;
    filename: string;
  }> {
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    
    const chunks: Buffer[] = [];
    archive.on('data', (chunk) => chunks.push(chunk));
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      for (const id of cuentaProvisoriaIds) {
        const data = await cuentaProvisoriaService.generatePDFData(id);
        const html = this.generateCuentaProvisoriaHTML(data);
        
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
          format: 'A4',
          margin: {
            top: '2cm',
            right: '1.5cm',
            bottom: '2cm',
            left: '1.5cm'
          },
          printBackground: true,
          preferCSSPageSize: true
        });
        
        const filename = cuentaProvisoriaService.generateFileName(
          data.cuenta.rol,
          data.cuenta.debtorName,
          data.cuenta.month,
          data.cuenta.year
        );
        
        archive.append(pdfBuffer, { name: filename });
        await page.close();
      }
      
      archive.finalize();
      
      return new Promise((resolve, reject) => {
        archive.on('end', () => {
          const zipFilename = `cuentas_provisorias_${new Date().toISOString().split('T')[0]}.zip`;
          resolve({
            buffer: Buffer.concat(chunks),
            filename: zipFilename
          });
        });
        
        archive.on('error', reject);
      });
    } finally {
      await browser.close();
    }
  }

  // Generar vista previa HTML
  async generateCuentaProvisoriaPreview(cuentaProvisoriaId: number): Promise<string> {
    const data = await cuentaProvisoriaService.generatePDFData(cuentaProvisoriaId);
    return this.generateCuentaProvisoriaHTML(data);
  }
}

export const pdfGeneratorService = new PDFGeneratorService();