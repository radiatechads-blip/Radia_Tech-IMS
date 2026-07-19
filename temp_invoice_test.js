const http = require('http');
const makeRequest = (options, body) => new Promise((resolve, reject) => {
  const req = http.request(options, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => resolve({ status: res.statusCode, body: data }));
  });
  req.on('error', reject);
  if (body) req.write(body);
  req.end();
});
(async () => {
  try {
    const list = await makeRequest({ hostname: 'localhost', port: 3000, path: '/api/invoices?documentType=quotation', method: 'GET' });
    console.log('list status', list.status);
    const invoices = JSON.parse(list.body || '[]');
    console.log('found', invoices.length);
    if (!invoices.length) return;
    const inv = invoices[0];
    console.log('sample invoice', inv.invoiceNumber, inv.id, inv.billType, inv.documentType);
    const sourceInvoiceNumber = inv.invoiceNumber || '';
    const taxInvoiceNumber = `TI-${sourceInvoiceNumber.replace(/^[A-Z]+-?/i, '')}`;
    const newTaxInvoice = {
      ...inv,
      documentType: 'invoice',
      billType: 'Tax Invoice',
      invoiceNumber: taxInvoiceNumber,
      invoiceDate: new Date().toISOString().split('T')[0],
      paymentTerms: 'Due on Receipt',
      notes: `Converted from Quotation ${sourceInvoiceNumber}${inv.notes ? `\n${inv.notes}` : ''}`,
      createdAt: new Date().toISOString(),
      status: 'Active',
      convertedToTaxInvoice: false,
      sourceProformaNumber: sourceInvoiceNumber,
      convertedFromProforma: false,
    };
    console.log('payload sample', JSON.stringify(newTaxInvoice, null, 2).slice(0, 2000));
    const createRes = await makeRequest({ hostname: 'localhost', port: 3000, path: '/api/invoices', method: 'POST', headers: { 'Content-Type': 'application/json' } }, JSON.stringify(newTaxInvoice));
    console.log('create status', createRes.status);
    console.log(createRes.body);
  } catch (err) {
    console.error(err);
  }
})();
