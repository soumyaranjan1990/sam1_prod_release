import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

/**
 * Custom hook to fetch and manage officer availability data.
 * Can be used by any component needing real-time case-load information.
 */
export const useOfficerAvailability = () => {
    const [availability, setAvailability] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAvailability = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.fetchWithAuth('/auth/officers/availability');
            setAvailability(data || {});
        } catch (err) {
            console.error('Failed to load officer availability:', err);
            setError(err.message || 'Failed to load availability');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAvailability();
    }, [fetchAvailability]);

    return {
        availability,
        loading,
        error,
        refresh: fetchAvailability,
        eos: availability['ENQUIRY_OFFICER'] || [],
        cos: availability['CO'] || [],
        das: availability['DA'] || []
    };
};
