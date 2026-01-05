import { useEffect } from 'react';
import { Navigate, useParams, useLocation } from 'react-router-dom';

const LegacyInvoiceRedirect = () => {
    const { id } = useParams<{ id?: string }>();
    const location = useLocation();

    // Redirect /invoices -> /orders
    // Redirect /invoices/:id -> /orders/:id
    const redirectTo = id ? `/orders/${id}` : '/orders';

    useEffect(() => {
        console.log(`[LegacyInvoiceRedirect] Redirecting from ${location.pathname} to ${redirectTo}`);
    }, [location.pathname, redirectTo]);

    return <Navigate to={redirectTo} replace />;
};

export default LegacyInvoiceRedirect;
