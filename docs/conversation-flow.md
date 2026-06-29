# LeadLens Conversation Flow

This document outlines the conditional paths and steps taken by the Venturizer Lead Qualification Chatbot. The chatbot utilizes two distinct persona flows (Founder and Investor) that capture different datasets and apply dynamic skip logic based on previous answers.

## Flow Diagram

```mermaid
flowchart TD
    %% Base Start
    Start((Start Chat)) --> Persona{Are you a Founder or Investor?}
    
    %% Persona Split
    Persona -->|Founder| F1[1. Full Name]
    Persona -->|Investor| I1[1. Full Name]

    %% FOUNDER FLOW
    subgraph Founder Flow [20 Steps]
        F1 --> F2[2. Email]
        F2 --> F3[3. Phone Number *]
        F3 --> F4[4. LinkedIn URL *]
        F4 --> F5[5. Role in Startup]
        F5 --> F6[6. Startup Name]
        F6 --> F7[7. Industry Sector]
        F7 --> F8[8. Problem Statement]
        F8 --> F9[9. Solution Summary]
        F9 --> F10[10. MVP Status]
        F10 --> F11[11. Active Users]
        
        %% Conditional Logic for Growth Rate
        F11 --> F_Users{Active Users > 0?}
        F_Users -->|Yes| F12[13. Growth Rate %]
        F_Users -->|No| F13[12. Monthly Revenue]
        F12 --> F13
        
        F13 --> F14[14. Team Size]
        F14 --> F15[15. Technical Co-founder?]
        F15 --> F16[16. Funding Stage]
        F16 --> F17[17. Amount Raising USD]
        F17 --> F18[18. Use of Funds]
        F18 --> F19[19. Has Paying Customers?]
        
        %% Conditional Logic for Testimonials
        F19 --> F_Cust{Paying Customers?}
        F_Cust -->|Yes| F20[20. Customer Testimonials *]
        F_Cust -->|No| F_Score[Scoring Engine]
        F20 --> F_Score
    end

    %% INVESTOR FLOW
    subgraph Investor Flow [18 Steps]
        I1 --> I2[2. Email]
        I2 --> I3[3. Phone Number *]
        I3 --> I4[4. Firm Name]
        I4 --> I5[5. LinkedIn URL *]
        I5 --> I6[6. Thesis Summary]
        I6 --> I7[7. Preferred Sectors]
        I7 --> I8[8. Stage Focus]
        I8 --> I9[9. Typical Cheque USD]
        I9 --> I10[10. Min Cheque USD *]
        I10 --> I11[11. Max Cheque USD *]
        I11 --> I12[12. Portfolio Size]
        I12 --> I13[13. Notable Investments *]
        I13 --> I14[14. Geography Focus]
        I14 --> I15[15. Support Type]
        I15 --> I16[16. Involvement Level]
        I16 --> I17[17. Deployment Timeline]
        I17 --> I18[18. Num Deals per Year]
        I18 --> I_Score[Scoring Engine]
    end

    %% Evaluation
    F_Score --> Eval[Evaluate 0-100 Score]
    I_Score --> Eval

    %% Buckets
    Eval --> Bucket{Score Bucket}
    Bucket -->|80-100| Hot(Hot 🔥: Immediate Outreach)
    Bucket -->|60-79| Good(Good ✅: Standard Follow-up)
    Bucket -->|40-59| Maybe(Maybe 🤔: Request Clarification)
    Bucket -->|0-39| Low(Low 📋: Polite Rejection)

    %% Styling
    classDef optional fill:#f8fafc,stroke:#94a3b8,stroke-width:1px,stroke-dasharray: 5 5
    class F3,F4,F20,I3,I5,I10,I11,I13 optional

```

> Note: Nodes marked with `*` and dashed borders represent optional questions.

### Skip Logic Details
The chatbot engine implements smart skipping to reduce user friction:
- **Growth Rate (Founder step 13)**: If a founder reports `0` active users, the chatbot automatically skips asking for user growth rate, knowing it is inapplicable.
- **Customer Testimonials (Founder step 20)**: If a founder indicates they do not have paying customers, the chatbot does not request customer testimonials and proceeds directly to scoring.
