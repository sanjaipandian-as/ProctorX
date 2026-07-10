const ExcelJS = require('exceljs');
const prisma = require('../config/database');
const { formatDate } = require('../utils/helpers');

const exportQuizResultsToExcel = async (quizId) => {
  const quiz = await prisma.quiz.findUnique({
    where: { quizId },
    include: {
      results: {
        include: {
          student: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { score: 'desc' }
      }
    }
  });

  if (!quiz) {
    const err = new Error('Quiz not found');
    err.statusCode = 404;
    throw err;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Results');

  // Page title
  worksheet.mergeCells('A1:J1');
  worksheet.getCell('A1').value = `ProctorX Quiz Results Report: ${quiz.title}`;
  worksheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' } // Indigo color
  };
  worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 40;

  // Metadata rows
  worksheet.getCell('A2').value = `Quiz ID: ${quiz.quizId}`;
  worksheet.getCell('A2').font = { bold: true };
  worksheet.getCell('A3').value = `Total Submissions: ${quiz.results.length}`;
  worksheet.getCell('A3').font = { bold: true };
  worksheet.getCell('A4').value = `Report Generated: ${formatDate(new Date())}`;
  worksheet.getCell('A4').font = { italic: true };
  worksheet.getRow(2).height = 20;
  worksheet.getRow(3).height = 20;
  worksheet.getRow(4).height = 20;

  worksheet.addRow([]); // Blank spacer

  // Columns definition
  worksheet.columns = [
    { header: 'No.', key: 'index', width: 8 },
    { header: 'Student Name', key: 'name', width: 25 },
    { header: 'Student Email', key: 'email', width: 30 },
    { header: 'Score', key: 'score', width: 12 },
    { header: 'Total Questions', key: 'total', width: 18 },
    { header: 'Accuracy (%)', key: 'accuracy', width: 15 },
    { header: 'Time Taken (sec)', key: 'time', width: 18 },
    { header: 'Warnings', key: 'warnings', width: 12 },
    { header: 'Penalties', key: 'penalties', width: 12 },
    { header: 'Submitted At', key: 'submitted', width: 22 }
  ];

  // Format headers row (row 6)
  const headerRow = worksheet.getRow(6);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E1B4B' } // Dark blue
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'medium' },
      right: { style: 'thin' }
    };
  });

  // Populate results data
  quiz.results.forEach((r, idx) => {
    const row = worksheet.addRow({
      index: idx + 1,
      name: r.student?.name || 'Unknown Student',
      email: r.student?.email || 'N/A',
      score: r.score,
      total: r.totalQuestions,
      accuracy: `${r.accuracy}%`,
      time: r.timeTaken,
      warnings: r.warnings,
      penalties: r.penalties,
      submitted: formatDate(r.completedAt)
    });

    row.height = 20;
    const isHighWarnings = r.warnings >= 4;
    const isHighAccuracy = r.accuracy >= 80;

    row.eachCell((cell, colNumber) => {
      cell.alignment = { vertical: 'middle', horizontal: colNumber <= 3 || colNumber === 10 ? 'left' : 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      };
      
      if (isHighWarnings) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEE2E2' } // Light red fill (red-100)
        };
        cell.font = { color: { argb: 'FF991B1B' } }; // Dark red text
      } else if (colNumber === 6 && isHighAccuracy) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD1FAE5' } // Light green fill (emerald-100)
        };
        cell.font = { bold: true, color: { argb: 'FF065F46' } }; // Dark green text
      } else if (idx % 2 === 1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' }
        };
      }
    });
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

module.exports = {
  exportQuizResultsToExcel
};
