import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Navigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock3, Loader2 } from 'lucide-react';
import { API_URL } from '../lib/api.js';

// --------------------------------------------------------------------------
// Reached via navigate('/pay', { state: {...} }) from either application
// form once submission + document upload succeed, but ONLY if the batch
// they applied to actually has a fee. Everything this page needs
// (referenceId, applicationToken, feeAmount, the applicant's own name and
// phone) arrives via React Router's navigation state - nothing is
// refetched from the server, since the previous page already has it all
// fresh from the response it just received.
//
// If someone lands here directly (refreshed the page, bookmarked it,
// pasted the URL to a friend) there IS no navigation state, so we bounce
// them back to the home page rather than showing a broken form.
// --------------------------------------------------------------------------

const RELATIONSHIP_LABELS = {
  self: 'Myself',
  parent: 'My parent',
  guardian: 'My guardian',
  friend: 'A friend',
};

export default function PaymentPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [payerRelationship, setPayerRelationship] = useState('self');
  const [payerName, setPayerName] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  // Tracks what we've learned from POLLING, separate from `sent` (which
  // only means "we asked Safaricom to send a prompt", not "we know what
  // happened"). Safaricom's actual result arrives on OUR SERVER via a
  // callback the browser can never see directly - polling is how the
  // browser finds out. See payment-status-public in routes/payments.js.
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending | completed | failed | timeout
  const pollIntervalRef = useRef(null);
  const pollAttemptsRef = useRef(0);
  const MAX_POLL_ATTEMPTS = 30; // 30 x 4s = 2 minutes before we give up asking

  if (!state?.referenceId || !state?.applicationToken) {
    return <Navigate to="/" replace />;
  }

  const { referenceId, applicationToken, feeAmount, fullName, phoneNumber } = state;
  const isSelf = payerRelationship === 'self';

  // Start polling once the STK push has actually been sent. Cleans up the
  // interval on unmount (leaving the page) so it never keeps running in
  // the background after the applicant has navigated away.
  useEffect(() => {
    if (!sent) return;

    pollIntervalRef.current = setInterval(async () => {
      pollAttemptsRef.current += 1;

      try {
        const res = await fetch(
          `${API_URL}/api/applicants/${referenceId}/payment-status-public?token=${applicationToken}`
        );
        const data = await res.json();

        if (data.paymentStatus === 'completed') {
          setPaymentStatus('completed');
          clearInterval(pollIntervalRef.current);
          // Give them a moment to actually read the success message before
          // whisking them away - an instant redirect would feel jarring.
          setTimeout(() => navigate('/'), 3000);
        } else if (data.paymentStatus === 'failed') {
          setPaymentStatus('failed');
          clearInterval(pollIntervalRef.current);
        } else if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
          // Not an error - the applicant may just be slow to respond to
          // the PIN prompt. We stop asking, but their record will still
          // update correctly whenever Safaricom's callback does arrive,
          // even after this page is closed.
          setPaymentStatus('timeout');
          clearInterval(pollIntervalRef.current);
        }
      } catch {
        // A single failed poll isn't worth alarming anyone about - just
        // let the next interval tick try again.
      }
    }, 4000);

    return () => clearInterval(pollIntervalRef.current);
  }, [sent]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!isSelf && (!payerName.trim() || !payerPhone.trim())) {
      setError("Please provide the payer's name and phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/applicants/${referenceId}/request-payment-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: applicationToken,
          payerRelationship,
          payerName: isSelf ? fullName : payerName.trim(),
          payerPhone: isSelf ? phoneNumber : payerPhone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send payment request.');
        return;
      }
      setSent(true);
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (sent) {
    return (
      <main className="page-center">
        <div className="card narrow" style={{ textAlign: 'center' }}>
          {paymentStatus === 'pending' && (
            <>
              <div className="icon-circle icon-circle-pending">
                <Loader2 size={30} className="spin" />
              </div>
              <h1>Check your phone</h1>
              <p style={{ color: 'var(--color-text-muted)' }}>
                A payment request has been sent to {isSelf ? 'your phone' : `${payerName}'s phone`}. Enter your
                M-Pesa PIN to complete your registration.
              </p>
              <div className="payment-detail-box">
                <div>Amount: <strong>KES {Number(feeAmount).toLocaleString()}</strong></div>
                <div>Reference: <strong>#{referenceId}</strong></div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-primary)' }}>
                Waiting for confirmation — this page updates automatically, no need to refresh.
              </p>
            </>
          )}

          {paymentStatus === 'completed' && (
            <>
              <div className="icon-circle icon-circle-success">
                <CheckCircle2 size={32} />
              </div>
              <h1 style={{ color: '#166534' }}>Thank you!</h1>
              <p style={{ color: 'var(--color-text-muted)' }}>
                Your payment has been received and your registration is complete. Our team will be in touch soon
                with details on when to join and what to bring — keep an eye on your phone.
              </p>
              <div className="payment-detail-box">
                <div>Reference: <strong>#{referenceId}</strong></div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Redirecting you to the home page…</p>
            </>
          )}

          {paymentStatus === 'failed' && (
            <>
              <div className="icon-circle icon-circle-error">
                <XCircle size={32} />
              </div>
              <h1 style={{ color: '#991b1b' }}>Payment didn't go through</h1>
              <p style={{ color: 'var(--color-text-muted)' }}>
                It looks like the payment was cancelled or didn't complete in time — that happens sometimes. Your
                application is still safely saved, so there's no need to start over. You're welcome to try the
                payment again whenever you're ready.
              </p>
              <button
                className="button"
                style={{ marginTop: 4 }}
                onClick={() => {
                  setSent(false);
                  setPaymentStatus('pending');
                  pollAttemptsRef.current = 0;
                }}
              >
                Try payment again
              </button>
            </>
          )}

          {paymentStatus === 'timeout' && (
            <>
              <div className="icon-circle icon-circle-neutral">
                <Clock3 size={30} />
              </div>
              <h1>Still on its way</h1>
              <p style={{ color: 'var(--color-text-muted)' }}>
                We haven't heard back yet, but there's nothing to worry about — your application is saved, and
                we'll update your record automatically the moment the payment goes through, even if you close this
                page.
              </p>
              <div className="payment-detail-box">
                <div>Reference: <strong>#{referenceId}</strong></div>
              </div>
            </>
          )}

          <Link to="/" className="button button-secondary" style={{ display: 'inline-block', marginTop: 16 }}>
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-center">
      <form className="card narrow" onSubmit={handleSubmit}>
        <div className="icon-circle icon-circle-pending" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)', color: 'white' }}>
          <span style={{ fontSize: 22, fontWeight: 700 }}>KES</span>
        </div>
        <h1 style={{ marginTop: 0, textAlign: 'center' }}>Complete Payment</h1>
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: -8 }}>
          A fee of <strong>KES {Number(feeAmount).toLocaleString()}</strong> applies to this application.
        </p>

        {error && <div className="banner-error">{error}</div>}

        <div className="field">
          <label>Who is paying?</label>
          <select value={payerRelationship} onChange={(e) => setPayerRelationship(e.target.value)}>
            {Object.entries(RELATIONSHIP_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {isSelf ? (
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            The payment prompt will be sent to your own phone number ({phoneNumber}).
          </p>
        ) : (
          <>
            <div className="field">
              <label>Payer's full name</label>
              <input value={payerName} onChange={(e) => setPayerName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="field">
              <label>Payer's phone number</label>
              <input value={payerPhone} onChange={(e) => setPayerPhone(e.target.value)} placeholder="07XXXXXXXX" />
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                The M-Pesa payment prompt goes to THIS number, not the applicant's.
              </p>
            </div>
          </>
        )}

        <button type="submit" className="button" style={{ width: '100%', marginTop: 8 }} disabled={isSubmitting}>
          {isSubmitting ? 'Sending…' : 'Send payment request'}
        </button>
      </form>
    </main>
  );
}