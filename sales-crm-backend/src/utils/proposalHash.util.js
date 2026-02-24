const crypto = require('crypto');

const generateProposalHash = (data) => {
  const relevantData = {
    OpportunityId: data.OpportunityId,
    ProposalTitle: data.ProposalTitle,
    ProposalAmount: Number(data.ProposalAmount),
    Currency: data.Currency,    
    PaymentTerms: data.PaymentTerms || '',
    DeliveryTerms: data.DeliveryTerms || '',
    ProposalDocumentPath: data.ProposalDocumentPath || ''
  };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(relevantData))
    .digest('hex');
};

module.exports = {
  generateProposalHash
};
