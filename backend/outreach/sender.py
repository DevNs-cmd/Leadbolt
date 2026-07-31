import os
from datetime import datetime
from typing import Dict, Any

# In-memory message store
message_history = []

class MessageSender:
    def __init__(self):
        self.sendgrid_api_key = os.getenv('SENDGRID_API_KEY', '')
        self.twilio_account_sid = os.getenv('TWILIO_ACCOUNT_SID', '')
        self.twilio_auth_token = os.getenv('TWILIO_AUTH_TOKEN', '')
        self.twilio_whatsapp_number = os.getenv('TWILIO_WHATSAPP_NUMBER', '')
        self.sender_email = os.getenv('SENDER_EMAIL', 'noreply@leadbolt.com')
        
    def send_email(self, to_email: str, subject: str, body: str) -> Dict[str, Any]:
        print(f"📧 [DEMO] Sending email to {to_email}:")
        print(f"Subject: {subject}")
        print(f"Body: {body}")
        return {"status": "demo", "message": "Email sent (demo mode)"}
    
    def send_whatsapp(self, to_number: str, message: str) -> Dict[str, Any]:
        print(f"💬 [DEMO] Sending WhatsApp to {to_number}:")
        print(f"Message: {message}")
        return {"status": "demo", "message": "WhatsApp sent (demo mode)"}
    
    def log_message(self, channel: str, to: str, template_id: str, body: str, status: str):
        entry = {
            "id": len(message_history) + 1,
            "channel": channel,
            "to": to,
            "template_id": template_id,
            "body": body[:100] + "..." if len(body) > 100 else body,
            "status": status,
            "sent_at": datetime.now().isoformat()
        }
        message_history.append(entry)
        return entry

sender = MessageSender()

def send_message(to: str, subject: str, body: str, channel: str, template_id: str) -> Dict[str, Any]:
    if channel == 'email':
        result = sender.send_email(to, subject, body)
    elif channel == 'whatsapp':
        result = sender.send_whatsapp(to, body)
    else:
        return {"status": "error", "message": "Invalid channel"}
    
    sender.log_message(channel, to, template_id, body, result.get('status', 'unknown'))
    return result

def get_message_history():
    return message_history

def get_automation_rules():
    return [
        {
            "id": 1,
            "name": "Welcome Follow-up",
            "trigger": "Lead Created",
            "delay": "24 hours",
            "template": "welcome",
            "channel": "email",
            "active": True
        }
    ]