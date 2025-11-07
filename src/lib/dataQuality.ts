// Data Quality Scoring System for Vessel Information
// Calculates 0-100 quality score based on data completeness

export interface QualityMetrics {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  completeness: number; // percentage
  missingFields: string[];
  strengths: string[];
  category: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Insufficient';
}

export function calculateVesselDataQuality(data: any): QualityMetrics {
  let score = 0;
  const missingFields: string[] = [];
  const strengths: string[] = [];
  
  // CRITICAL FIELDS (40 points total)
  if (data.imoNumber) {
    score += 10;
    strengths.push('IMO Number verified');
  } else {
    missingFields.push('IMO Number');
  }
  
  if (data.commercialOperator || data.operatorName) {
    score += 15;
    strengths.push('Commercial operator identified');
  } else {
    missingFields.push('Commercial Operator');
  }
  
  if (data.procurementEmail || data.suppliesEmail) {
    score += 15;
    strengths.push('Procurement contact available');
  } else {
    missingFields.push('Procurement Email');
  }
  
  // HIGH-VALUE FIELDS (30 points total)
  if (data.technicalManager) {
    score += 10;
    strengths.push('Technical manager identified');
  } else {
    missingFields.push('Technical Manager');
  }
  
  if (data.nextPort && data.eta) {
    score += 10;
    strengths.push('ETA/Port data available');
  } else {
    missingFields.push('Port Schedule');
  }
  
  if (data.portAgent && (data.agentPhone || data.agentEmail)) {
    score += 10;
    strengths.push('Port agent contact');
  } else {
    missingFields.push('Port Agent');
  }
  
  // USEFUL FIELDS (20 points total)
  if (data.companyWebsite) {
    score += 5;
    strengths.push('Company website');
  }
  
  if (data.companyPhone) {
    score += 5;
    strengths.push('Company phone');
  }
  
  if (data.fleetSize && data.fleetSize > 1) {
    score += 5;
    strengths.push(`Fleet operator (${data.fleetSize} vessels)`);
  }
  
  if (data.classificationSociety) {
    score += 5;
    strengths.push('Classification verified');
  }
  
  // BONUS FIELDS (10 points total)
  if (data.crewSize) score += 2;
  if (data.technicalEmail || data.sparesEmail) score += 3;
  if (data.invoiceEmail) score += 2;
  if (data.shipManager) score += 3;
  
  // Calculate completeness percentage
  const totalFields = 25; // Total trackable fields
  const filledFields = totalFields - missingFields.length;
  const completeness = Math.round((filledFields / totalFields) * 100);
  
  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  let category: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Insufficient';
  
  if (score >= 90) {
    grade = 'A';
    category = 'Excellent';
  } else if (score >= 75) {
    grade = 'B';
    category = 'Good';
  } else if (score >= 60) {
    grade = 'C';
    category = 'Fair';
  } else if (score >= 40) {
    grade = 'D';
    category = 'Poor';
  } else {
    grade = 'F';
    category = 'Insufficient';
  }
  
  return {
    score,
    grade,
    completeness,
    missingFields,
    strengths,
    category,
  };
}

export function getQualityColor(score: number): string {
  if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
  if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

