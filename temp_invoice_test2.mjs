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
  try {
    const list = await makeRequest({ hostname: "localhost", port: 3000, path: "/api/invoices?documentType=quotation", method: "GET" });
    const invoices = JSON.parse(list.body || "[]");
    if (!invoices.length) return;
    const inv = invoices[0];
    const sourceInvoiceNumber = inv.invoiceNumber || "";
    const taxInvoiceNumber = `TI-${sourceInvoiceNumber.replace(/^[A-Z]+-?/i, "")}`;
    const newTaxInvoice = {
      ...inv,
      documentType: "invoice",
      billType: "Tax Invoice",
      invoiceNumber: taxInvoiceNumber,
      invoiceDate: new Date().toISOString().split("T")[0],
      paymentTerms: "Due on Receipt",
      notes: `Converted from Quotation ${sourceInvoiceNumber}${inv.notes ? `\n${inv.notes}` : ""}`,
      createdAt: new Date().toISOString(),
      status: "Active",
      convertedToTaxInvoice: false,
      sourceProformaNumber: sourceInvoiceNumber,
      convertedFromProforma: false,
    };
    const createRes = await makeRequest({ hostname: "localhost", port: 3000, path: "/api/invoices", method: "POST", headers: { "Content-Type": "application/json" } }, JSON.stringify(newTaxInvoice));
    console.log('CREATE', createRes.status, createRes.body);
    const created = JSON.parse(createRes.body || '{}');
    if (!created.id) return;
    const conversionPayload = {
      ...inv,
      convertedToTaxInvoice: true,
      convertedInvoiceId: created.id,
      convertedInvoiceNumber: created.invoiceNumber || taxInvoiceNumber,
      convertedFromProforma: false,
      sourceProformaNumber: sourceInvoiceNumber,
      documentType: 'quotation',
    };
    const putRes = await makeRequest({ hostname: "localhost", port: 3000, path: `/api/invoices?id=${encodeURIComponent(inv.id)}&documentType=quotation`, method: "PUT", headers: { "Content-Type": "application/json" } }, JSON.stringify(conversionPayload));
    console.log('PUT', putRes.status, putRes.body);
  } catch (err) {
    console.error(err);
  }
})();
