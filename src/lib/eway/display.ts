function pickFirstString(...values: Array<unknown>) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null;
}

function parseWhiteBooksPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null;

  const record = payload as Record<string, unknown>;
  const candidates: Array<Record<string, unknown>> = [];
  const visited = new Set<object>();

  const parseJsonString = (value: unknown) => {
    if (typeof value !== 'string') return null;
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Ignore JSON parsing failures and fall back to the source object.
    }
    return null;
  };

  const addCandidate = (value: unknown) => {
    if (value && typeof value === 'object') {
      const objectValue = value as object;
      if (!visited.has(objectValue)) {
        visited.add(objectValue);
        candidates.push(value as Record<string, unknown>);
      }
    }
  };

  const walk = (value: unknown) => {
    addCandidate(value);

    if (!value || typeof value !== 'object') return;

    const recordValue = value as Record<string, unknown>;
    const nestedValues = [recordValue.result, recordValue.data, recordValue.response, recordValue.payload];

    for (const nestedValue of nestedValues) {
      if (nestedValue && typeof nestedValue === 'string') {
        const parsed = parseJsonString(nestedValue);
        if (parsed) {
          walk(parsed);
        }
      } else {
        walk(nestedValue);
      }
    }

    for (const nestedValue of Object.values(recordValue)) {
      if (nestedValue && typeof nestedValue === 'object') {
        walk(nestedValue);
      }
    }
  };

  walk(record);

  const preferredCandidate = candidates.find((candidate) => {
    const maybe = candidate as Record<string, unknown>;
    return Boolean(
      pickFirstString(
        maybe.ewayBillNumber,
        maybe.ewayBillNo,
        maybe.ewbNo,
        maybe.billNo,
        maybe.ebNo,
        maybe.qrText,
        maybe.qrData,
        maybe.qrCode,
        maybe.qrImageText,
      ),
    );
  }) || candidates.find((candidate) => {
    const maybe = candidate as Record<string, unknown>;
    return Boolean(
      pickFirstString(
        maybe.portalMessage,
        maybe.message,
        maybe.status_desc,
        maybe.statusDescription,
      ),
    );
  });

  if (preferredCandidate) {
    return preferredCandidate;
  }

  return record;
}

export function extractEWayBillDisplayResult(data: any) {
  const payload = data?.result ?? data?.data ?? data;
  const payloadRecord = asRecord(payload);
  const displayPayload = asRecord(data?.display);
  const parsedPayload = parseWhiteBooksPayload(payload);
  const parsedRecord = asRecord(parsedPayload);
  const failureStatus = pickFirstString(
    parsedRecord?.status_desc,
    payloadRecord?.status_desc,
    data?.status_desc,
    parsedRecord?.statusDescription,
    payloadRecord?.statusDescription,
    data?.statusDescription,
    asRecord(parsedRecord?.result)?.status_desc,
    asRecord(parsedRecord?.data)?.status_desc,
    asRecord(parsedRecord?.response)?.status_desc,
    asRecord(parsedRecord?.payload)?.status_desc,
    asRecord(payloadRecord?.result)?.status_desc,
    asRecord(payloadRecord?.data)?.status_desc,
    asRecord(payloadRecord?.response)?.status_desc,
    asRecord(payloadRecord?.payload)?.status_desc,
    asRecord(data?.result)?.status_desc,
    asRecord(data?.data)?.status_desc,
    asRecord(data?.response)?.status_desc,
    asRecord(data?.payload)?.status_desc,
  );
  const portalMessage = pickFirstString(
    displayPayload?.portalMessage,
    parsedRecord?.portalMessage,
    parsedRecord?.message,
    parsedRecord?.status_desc,
    parsedRecord?.statusDescription,
    payloadRecord?.portalMessage,
    payloadRecord?.message,
    payloadRecord?.status_desc,
    payloadRecord?.statusDescription,
    data?.message,
    data?.status_desc,
    data?.statusDescription,
    asRecord(parsedRecord?.result)?.portalMessage,
    asRecord(parsedRecord?.result)?.message,
    asRecord(parsedRecord?.result)?.status_desc,
    asRecord(parsedRecord?.result)?.statusDescription,
    asRecord(parsedRecord?.data)?.portalMessage,
    asRecord(parsedRecord?.data)?.message,
    asRecord(parsedRecord?.data)?.status_desc,
    asRecord(parsedRecord?.data)?.statusDescription,
    asRecord(parsedRecord?.response)?.portalMessage,
    asRecord(parsedRecord?.response)?.message,
    asRecord(parsedRecord?.response)?.status_desc,
    asRecord(parsedRecord?.response)?.statusDescription,
    asRecord(parsedRecord?.payload)?.portalMessage,
    asRecord(parsedRecord?.payload)?.message,
    asRecord(parsedRecord?.payload)?.status_desc,
    asRecord(parsedRecord?.payload)?.statusDescription,
    asRecord(payloadRecord?.result)?.portalMessage,
    asRecord(payloadRecord?.result)?.message,
    asRecord(payloadRecord?.result)?.status_desc,
    asRecord(payloadRecord?.result)?.statusDescription,
    asRecord(payloadRecord?.data)?.portalMessage,
    asRecord(payloadRecord?.data)?.message,
    asRecord(payloadRecord?.data)?.status_desc,
    asRecord(payloadRecord?.data)?.statusDescription,
    asRecord(payloadRecord?.response)?.portalMessage,
    asRecord(payloadRecord?.response)?.message,
    asRecord(payloadRecord?.response)?.status_desc,
    asRecord(payloadRecord?.response)?.statusDescription,
    asRecord(payloadRecord?.payload)?.portalMessage,
    asRecord(payloadRecord?.payload)?.message,
    asRecord(payloadRecord?.payload)?.status_desc,
    asRecord(payloadRecord?.payload)?.statusDescription,
    asRecord(data?.result)?.portalMessage,
    asRecord(data?.result)?.message,
    asRecord(data?.result)?.status_desc,
    asRecord(data?.result)?.statusDescription,
    asRecord(data?.data)?.portalMessage,
    asRecord(data?.data)?.message,
    asRecord(data?.data)?.status_desc,
    asRecord(data?.data)?.statusDescription,
    asRecord(data?.response)?.portalMessage,
    asRecord(data?.response)?.message,
    asRecord(data?.response)?.status_desc,
    asRecord(data?.response)?.statusDescription,
    asRecord(data?.payload)?.portalMessage,
    asRecord(data?.payload)?.message,
    asRecord(data?.payload)?.status_desc,
    asRecord(data?.payload)?.statusDescription,
    failureStatus,
  );
  const ewayBillNumber = pickFirstString(
    displayPayload?.ewayBillNumber,
    displayPayload?.ewayBillNo,
    displayPayload?.ewbNo,
    parsedRecord?.ewayBillNumber,
    parsedRecord?.ewayBillNo,
    parsedRecord?.eWayBillNo,
    parsedRecord?.eWayBillNumber,
    parsedRecord?.ewbNo,
    parsedRecord?.billNo,
    parsedRecord?.ebNo,
    asRecord(parsedRecord?.result)?.ewayBillNo,
    asRecord(parsedRecord?.result)?.ewayBillNumber,
    asRecord(parsedRecord?.result)?.eWayBillNo,
    asRecord(parsedRecord?.result)?.eWayBillNumber,
    asRecord(parsedRecord?.result)?.ewbNo,
    asRecord(parsedRecord?.data)?.ewayBillNumber,
    asRecord(parsedRecord?.data)?.ewayBillNo,
    asRecord(parsedRecord?.data)?.eWayBillNo,
    asRecord(parsedRecord?.data)?.eWayBillNumber,
    asRecord(parsedRecord?.data)?.ewbNo,
    payloadRecord?.ewayBillNumber,
    payloadRecord?.ewayBillNo,
    payloadRecord?.eWayBillNo,
    payloadRecord?.eWayBillNumber,
    payloadRecord?.ewbNo,
    payloadRecord?.billNo,
    payloadRecord?.ebNo,
    asRecord(payloadRecord?.result)?.ewayBillNo,
    asRecord(payloadRecord?.result)?.ewayBillNumber,
    asRecord(payloadRecord?.result)?.eWayBillNo,
    asRecord(payloadRecord?.result)?.eWayBillNumber,
    asRecord(payloadRecord?.result)?.ewbNo,
    asRecord(payloadRecord?.data)?.ewayBillNumber,
    asRecord(payloadRecord?.data)?.ewayBillNo,
    asRecord(payloadRecord?.data)?.eWayBillNo,
    asRecord(payloadRecord?.data)?.eWayBillNumber,
    asRecord(payloadRecord?.data)?.ewbNo,
    data?.ewayBillNumber,
    data?.ewayBillNo,
    data?.eWayBillNo,
    data?.eWayBillNumber,
    data?.ewbNo,
    data?.billNo,
    data?.ebNo,
  );

  const qrText = pickFirstString(
    displayPayload?.qrText,
    displayPayload?.qrData,
    displayPayload?.qrCode,
    parsedRecord?.qrText,
    parsedRecord?.qrData,
    parsedRecord?.qrCode,
    parsedRecord?.qrImageText,
    payloadRecord?.qrText,
    payloadRecord?.qrData,
    payloadRecord?.qrCode,
    payloadRecord?.qrImageText,
    data?.qrText,
    data?.qrData,
    data?.qrCode,
    data?.qrImageText,
  );

  const qrImageUrl = pickFirstString(
    displayPayload?.qrImageUrl,
    displayPayload?.qrImage,
    displayPayload?.qrCodeUrl,
    parsedRecord?.qrImageUrl,
    parsedRecord?.qrImage,
    parsedRecord?.qrCodeUrl,
    parsedRecord?.qrUrl,
    payloadRecord?.qrImageUrl,
    payloadRecord?.qrImage,
    payloadRecord?.qrCodeUrl,
    payloadRecord?.qrUrl,
    data?.qrImageUrl,
    data?.qrImage,
    data?.qrCodeUrl,
    data?.qrUrl,
  );

  const success = Boolean(ewayBillNumber);
  const effectivePortalMessage = success
    ? portalMessage || 'E-Way Bill generated successfully.'
    : (portalMessage && portalMessage !== 'E-Way Bill request sent successfully.'
      ? portalMessage
      : 'The portal did not return a valid e-way bill number. Please verify the response payload or credentials.');

  return {
    ewayBillNumber,
    portalMessage: effectivePortalMessage,
    qrText,
    qrImageUrl: qrImageUrl || undefined,
    success,
  };
}
