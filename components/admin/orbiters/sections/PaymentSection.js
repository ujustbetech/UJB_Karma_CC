'use client';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import FormField from '@/components/ui/FormField';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';

import { CreditCard, CheckCircle, Image as ImageIcon } from 'lucide-react';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function PaymentSection({ profile }) {
  const { formData, setFormData, approveBusiness } = profile;

  const payment = formData?.payment || {
    orbiter: {},
    cosmo: {},
  };

  const isCosmo = formData?.Category === 'CosmOrbiter';

  const paymentModes = [
    { label: 'Select', value: '' },
    { label: 'UPI', value: 'UPI' },
    { label: 'Cash', value: 'Cash' },
    { label: 'Bank Transfer', value: 'Bank Transfer' },
    { label: 'Credit Card', value: 'Credit Card' },
    { label: 'Debit Card', value: 'Debit Card' },
    { label: 'NEFT/RTGS', value: 'NEFT/RTGS' },
  ];

  const updatePayment = (type, field, value) => {
    setFormData({
      ...formData,
      payment: {
        ...payment,
        [type]: {
          ...payment[type],
          [field]: value,
        },
      },
    });
  };

  const togglePaid = (type, checked) => {
    updatePayment(type, 'status', checked ? 'paid' : 'unpaid');
    if (checked && !payment[type]?.paidDate) {
      updatePayment(type, 'paidDate', todayISO());
    }
  };

  const onScreenshotChange = (type, file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    updatePayment(type, 'screenshotFile', file);
    updatePayment(type, 'screenshotPreview', preview);
  };

  const clearScreenshot = (type) => {
    updatePayment(type, 'screenshotFile', null);
    updatePayment(type, 'screenshotPreview', payment[type]?.screenshotURL || '');
  };

  const statusPill = (status) => {
    if (status === 'paid') return <StatusBadge status="success">Paid</StatusBadge>;
    if (status === 'adjusted') return <StatusBadge status="warning">Adjusted</StatusBadge>;
    return <StatusBadge status="danger">Unpaid</StatusBadge>;
  };

  const orbiterStatus = () => {
    if (payment?.orbiter?.feeType === 'adjustment') return 'Adjusted';
    if (payment?.orbiter?.status === 'paid') return 'Paid';
    return 'Unpaid';
  };

  const cosmoStatus = () => {
    if (payment?.cosmo?.status === 'paid') return 'Paid';
    return 'Unpaid';
  };

  const businessStatus = () => {
    if (formData?.subscription?.startDate) return 'Approved';
    return 'Pending';
  };


  const feeSummary = (
    <div className="flex gap-3 mt-4">
      <div className="px-3 py-1 rounded bg-slate-100 text-sm">
        Orbiter: {orbiterStatus()}
      </div>

      {formData?.Category === 'CosmOrbiter' && (
        <div className="px-3 py-1 rounded bg-slate-100 text-sm">
          Cosmo: {cosmoStatus()}
        </div>
      )}

      <div className="px-3 py-1 rounded bg-slate-100 text-sm">
        Business: {businessStatus()}
      </div>
    </div>

  );



  return (
    <Card>
      <Text variant="h3" className="flex items-center gap-2">
        <CreditCard size={18} />
        Payment
      </Text>

      {feeSummary}

      {/* ================= ORBITER FEE ================= */}
      <div className="mt-6 p-4 rounded-xl bg-slate-50 space-y-4">
        <div className="flex items-center justify-between">
          <Text variant="h4">Orbiter Fee</Text>
          <Text variant="muted">₹1000</Text>
        </div>

        <FormField label="Fee Type">
          <Select
            value={payment.orbiter?.feeType || ''}
            options={[
              { label: 'Select', value: '' },
              { label: 'Upfront', value: 'upfront' },
              { label: 'Adjustment', value: 'adjustment' },
            ]}
            onChange={(v) => updatePayment('orbiter', 'feeType', v)}
          />
        </FormField>

        {payment.orbiter?.feeType === 'upfront' && (
          <>
            <FormField label="Paid?">
              <input
                type="checkbox"
                checked={payment.orbiter?.status === 'paid'}
                onChange={(e) => togglePaid('orbiter', e.target.checked)}
              />
            </FormField>

            {payment.orbiter?.status === 'paid' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Paid Date">
                    <Input
                      type="date"
                      value={payment.orbiter?.paidDate || ''}
                      onChange={(e) =>
                        updatePayment('orbiter', 'paidDate', e.target.value)
                      }
                    />
                  </FormField>

                  <FormField label="Payment Mode">
                    <Select
                      value={payment.orbiter?.paymentMode || ''}
                      options={paymentModes}
                      onChange={(v) =>
                        updatePayment('orbiter', 'paymentMode', v)
                      }
                    />
                  </FormField>
                </div>

                <FormField label="Transaction ID">
                  <Input
                    value={payment.orbiter?.paymentId || ''}
                    onChange={(e) =>
                      updatePayment('orbiter', 'paymentId', e.target.value)
                    }
                  />
                </FormField>

                <FormField label="Screenshot">
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        onScreenshotChange('orbiter', e.target.files?.[0])
                      }
                    />

                    {payment.orbiter?.screenshotPreview && (
                      <div className="p-3 rounded-lg bg-white flex items-center gap-3">
                        <ImageIcon size={18} />
                        <img
                          src={payment.orbiter.screenshotPreview}
                          className="w-20 h-20 rounded-md object-cover"
                        />
                        <Button
                          variant="ghost"
                          onClick={() => clearScreenshot('orbiter')}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                </FormField>
              </>
            )}
          </>
        )}

        {payment.orbiter?.feeType === 'adjustment' && (
          <Text variant="muted">
            ₹1000 will be adjusted in future earnings.
          </Text>
        )}
      </div>

      {/* ================= COSMO FEE ================= */}
      {isCosmo && (
        <div className="mt-6 p-4 rounded-xl bg-slate-50 space-y-4">
          <div className="flex items-center justify-between">
            <Text variant="h4">CosmOrbiter Fee</Text>
            <Text variant="muted">₹5000</Text>
          </div>

          <FormField label="Paid?">
            <input
              type="checkbox"
              checked={payment.cosmo?.status === 'paid'}
              onChange={(e) => togglePaid('cosmo', e.target.checked)}
            />
          </FormField>

          {payment.cosmo?.status === 'paid' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Paid Date">
                  <Input
                    type="date"
                    value={payment.cosmo?.paidDate || ''}
                    onChange={(e) =>
                      updatePayment('cosmo', 'paidDate', e.target.value)
                    }
                  />
                </FormField>

                <FormField label="Payment Mode">
                  <Select
                    value={payment.cosmo?.paymentMode || ''}
                    options={paymentModes}
                    onChange={(v) =>
                      updatePayment('cosmo', 'paymentMode', v)
                    }
                  />
                </FormField>
              </div>

              <FormField label="Transaction ID">
                <Input
                  value={payment.cosmo?.paymentId || ''}
                  onChange={(e) =>
                    updatePayment('cosmo', 'paymentId', e.target.value)
                  }
                />
              </FormField>

              <FormField label="Screenshot">
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      onScreenshotChange('cosmo', e.target.files?.[0])
                    }
                  />

                  {payment.cosmo?.screenshotPreview && (
                    <div className="p-3 rounded-lg bg-white flex items-center gap-3">
                      <ImageIcon size={18} />
                      <img
                        src={payment.cosmo.screenshotPreview}
                        className="w-20 h-20 rounded-md object-cover"
                      />
                      <Button
                        variant="ghost"
                        onClick={() => clearScreenshot('cosmo')}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </FormField>
            </>
          )}

          {/* APPROVAL BLOCK */}
          {payment.cosmo?.status === 'paid' && (
            <div className="mt-4 p-4 rounded-xl bg-white space-y-2">

              {!formData?.subscription?.startDate ? (
                <Button variant="primary" onClick={approveBusiness}>
                  Approve Business
                </Button>
              ) : (
                <>
                  <Button variant="secondary" disabled>
                    Business Approved
                  </Button>

                  <Text variant="muted">
                    Approved on{' '}
                    {new Date(formData.subscription.startDate).toLocaleDateString()}
                  </Text>

                  <Text variant="muted">
                    Renewal due on{' '}
                    {new Date(formData.subscription.nextRenewalDate).toLocaleDateString()}
                  </Text>
                </>
              )}
            </div>
          )}


        </div>
      )}
    </Card>
  );
}
