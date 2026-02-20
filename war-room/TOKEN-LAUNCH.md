# Token Launch Strategy — $STUDIO

## Status: PRE-LAUNCH
Budget: ~10 SOL for dev buy + vesting

---

## Launch Method: Bundled Stealth via PumpPortal + Jito

### Why Bundled
- Token creation + dev buy execute in the **same Jito bundle**
- Snipers cannot front-run because they can't see the token before the dev buy lands
- Dev buy establishes floor before any public trading
- This is the standard for serious pump.fun launches in 2026

### Execution Flow
1. **Prepare token metadata** — name ($STUDIO), symbol, image, description
2. **Generate keypair** — new Solana keypair for the token mint
3. **Build bundle** — Two transactions in one Jito bundle:
   - TX1: Create token on pump.fun (uses PumpPortal API)
   - TX2: Dev buy (10 SOL)
4. **Submit via Jito** — Atomic execution, both succeed or both fail
5. **Verify** — Confirm token live on pump.fun, dev wallet holds tokens
6. **Announce** — Post on X with token address

### PumpPortal Bundled Transaction API
```
POST https://pumpportal.fun/api/trade-local
```
- Supports bundled create + buy in single request
- Jito tip included for priority
- Returns signed transaction for submission

### Anti-Sniper Measures
- Bundled execution prevents front-running
- No pre-announcement of token address
- Dev buy in same block as creation
- Consider using a fresh wallet (not linked to known addresses)

---

## Token Economics

### Allocation
- **Dev buy:** 10 SOL (~30-40% supply at bonding curve prices)
- **Vesting commitment:** No sells during hackathon period
- **Public commitment:** Posted on-chain and on X

### Utility
- $STUDIO gates access tiers on pump.studio:
  - **Free tier:** Basic analytics, limited API calls
  - **Pro tier:** Full analytics, 71-field snapshots, alerts (requires $STUDIO hold)
  - **VIP tier:** Agent API access, MCP Server, priority support (higher $STUDIO hold)
- Agent XP rewards paid in $STUDIO
- Creator fee integration with $STUDIO staking (future roadmap)

### Hackathon Compliance
- 10%+ team hold: YES (30-40% from dev buy)
- Live on pump.fun: YES (created through launchpad)
- Clean distribution: YES (no pre-sale, no insider allocation)

---

## Risk Factors

### Market Conditions
- Current crypto market sentiment: volatile
- pump.fun token market: active but competitive
- Mitigation: Bundled launch prevents worst-case sniper scenarios

### Sub-100 SOL Risk
- If token trades below 100 SOL market cap post-launch, looks weak
- Mitigation: Time launch for high-activity period (US market hours)
- Mitigation: Have content ready to post immediately after launch
- Mitigation: First stream within 1 hour of launch

### Sniper/Dumper Risk
- Bundled launch eliminates front-running
- Post-launch dumpers: Can't prevent, but dev hold creates floor confidence
- Mitigation: Transparent vesting commitment reduces sell pressure perception

---

## Launch Checklist
- [ ] Token metadata prepared (name, symbol, image, description)
- [ ] Fresh wallet generated and funded with 10+ SOL
- [ ] PumpPortal bundle transaction built and tested
- [ ] Jito bundle submission tested on devnet
- [ ] Launch announcement tweet drafted
- [ ] First stream queued and ready
- [ ] pump.studio dashboard ready to show $STUDIO live data
- [ ] Hackathon application ready to submit with token address
