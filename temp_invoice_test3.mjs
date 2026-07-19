import http from "http";
const makeRequest = (options, body) => new Promise((resolve, reject) => {
  const req = http.request(options, res => {
    let data = "";
    res.on("data", chunk => { data += chunk; });
    res.on("end", () => resolve({ status: res.statusCode, body: data }));
  });
  req.on("error", reject);
  if (body) req.write(body);
  req.end();
});
(async () => {
  const get = async (path) => {
    const r = await makeRequest({ hostname: "localhost", port: 3000, path, method: "GET" });
    return { status: r.status, body: JSON.parse(r.body || 'null') };
  };
  const post = async (path, data) => {
    const r = await makeRequest({ hostname: "localhost", port: 3000, path, method: "POST", headers: { "Content-Type": "application/json" } }, JSON.stringify(data));
    return { status: r.status, body: r.body };
  };
  const put = async (path, data) => {
    const r = await makeRequest({ hostname: "localhost", port: 3000, path, method: "PUT", headers: { "Content-Type": "application/json" } }, JSON.stringify(data));
    return { status: r.status, body: r.body };
  };
  const list = await get('/api/invoices?documentType=quotation');
  console.log('quotation list status', list.status);
  const invoices = list.body;
  console.log('found', invoices.length);
  if (!invoices.length) return;
  const inv = invoices[0];
  console.log('source id', inv.id, 'num', inv.invoiceNumber, 'billType', inv.billType, 'docType', inv.documentType, 'converted', inv.convertedToTaxInvoice, inv.convertedInvoiceNumber);
  const payload = {
    ...inv,
    documentType: 'invoice',
    billType: 'Tax Invoice',
    invoiceNumber: `TI-${String(inv.invoiceNumber || '').replace(/^[A-Z]+-?/i, '')}`,
    invoiceDate: new Date().toISOString().split('T')[0],
    paymentTerms: 'Due on Receipt',
    notes: `Converted from Quotation ${inv.invoiceNumber}${inv.notes ? `\n${inv.notes}` : ''}`,
    createdAt: new Date().toISOString(),
    status: 'Active',
    convertedToTaxInvoice: false,
    sourceProformaNumber: inv.invoiceNumber || '',
    convertedFromProforma: false,
  };
  const createRes = await post('/api/invoices', payload);
  console.log('create status', createRes.status, createRes.body);
  const created = JSON.parse(createRes.body || '{}');
  if (!created.id) return;
  const updatePayload = {
    ...inv,
    convertedToTaxInvoice: true,
    convertedInvoiceId: created.id,
    convertedInvoiceNumber: created.invoiceNumber,
    convertedFromProforma: false,
    sourceProformaNumber: inv.invoiceNumber,
    documentType: 'quotation',
  };
  const putRes = await put(`/api/invoices?id=${encodeURIComponent(inv.id)}&documentType=quotation`, updatePayload);
  console.log('put status', putRes.status, putRes.body);
  const getUpdated = await get(`/api/invoices?id=${encodeURIComponent(inv.id)}&documentType=quotation`);
  console.log('get updated status', getUpdated.status, JSON.stringify(getUpdated.body, null, 2).slice(0,1000));
})();
