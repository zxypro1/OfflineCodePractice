use rand::{Rng, thread_rng};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use crate::error::AppError;

/// OAuth state manager to prevent CSRF attacks
/// In production, consider using Redis or a database for distributed systems
#[derive(Clone)]
#[allow(dead_code)]
pub struct OAuthStateManager {
    states: Arc<Mutex<HashMap<String, u64>>>,
}

#[allow(dead_code)]
impl OAuthStateManager {
    pub fn new() -> Self {
        Self {
            states: Arc::new(Mutex::new(HashMap::new())),
        }
    }
    
    /// Generate a new random state token
    pub fn generate_state(&self) -> String {
        let mut rng = thread_rng();
        let state: String = (0..32)
            .map(|_| {
                let idx = rng.gen_range(0..62);
                match idx {
                    0..=25 => (b'a' + idx) as char,
                    26..=51 => (b'A' + (idx - 26)) as char,
                    _ => (b'0' + (idx - 52)) as char,
                }
            })
            .collect();
        
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        // Store state with timestamp
        self.states.lock().unwrap().insert(state.clone(), timestamp);
        
        // Clean up old states (older than 10 minutes)
        self.cleanup_old_states();
        
        state
    }
    
    /// Verify and consume a state token
    pub fn verify_and_consume(&self, state: &str) -> Result<(), AppError> {
        let mut states = self.states.lock().unwrap();
        
        if let Some(timestamp) = states.remove(state) {
            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs();
            
            // State expires after 10 minutes
            if now - timestamp > 600 {
                return Err(AppError::Auth("OAuth state expired".into()));
            }
            
            Ok(())
        } else {
            Err(AppError::Auth("Invalid OAuth state".into()))
        }
    }
    
    /// Clean up states older than 10 minutes
    fn cleanup_old_states(&self) {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        let mut states = self.states.lock().unwrap();
        states.retain(|_, &mut timestamp| now - timestamp <= 600);
    }
}

impl Default for OAuthStateManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_generate_and_verify_state() {
        let manager = OAuthStateManager::new();
        let state = manager.generate_state();
        
        assert_eq!(state.len(), 32);
        assert!(manager.verify_and_consume(&state).is_ok());
        
        // Should fail second time (consumed)
        assert!(manager.verify_and_consume(&state).is_err());
    }
    
    #[test]
    fn test_invalid_state() {
        let manager = OAuthStateManager::new();
        assert!(manager.verify_and_consume("invalid_state").is_err());
    }
}
