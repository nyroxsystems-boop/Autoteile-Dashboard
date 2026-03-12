// This view has been deprecated — all warehouse functionality lives in /wawi/
// Kept as redirect to avoid broken references.
import { Navigate } from 'react-router-dom';

export function WarehouseView() {
    return <Navigate to="/wawi/" replace />;
}