import asyncio
import httpx

API_URL = "http://127.0.0.1:8000"

async def test_all():
    results = []
    async with httpx.AsyncClient() as client:
        # Auth
        res = await client.post(f"{API_URL}/auth/login", json={"email": "admin@example.com", "password": "password"})
        if res.status_code != 200:
            print("Failed to authenticate.")
            return
        
        token = res.json().get('token')
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test Contacts
        print("Testing Contacts...")
        res = await client.post(f"{API_URL}/contacts", json={"email": "test@test.com", "first_name": "Test"}, headers=headers)
        results.append(("Create Contact", res.status_code, res.text))
        
        # Test Segments (Audiences)
        print("Testing Segments...")
        res = await client.post(f"{API_URL}/audiences", json={"name": "Test Audience"}, headers=headers)
        results.append(("Create Audience", res.status_code, res.text))
        if res.status_code == 200:
            audience_id = res.json().get('data', {}).get('id') or res.json().get('id')
        else:
            audience_id = "fake-id"
            
        print("Audience id:", audience_id)
        
        # Test Broadcasts without Audience
        print("Testing Broadcasts without Audience...")
        res = await client.post(f"{API_URL}/broadcasts", json={
            "name": "Test Broadcast",
            "from_email": "onboarding@resend.dev",
            "subject": "Test",
            "html": "<p>test</p>"
        }, headers=headers)
        results.append(("Create Broadcast No Audience", res.status_code, res.text))

        # Test Broadcasts with Audience
        print("Testing Broadcasts with Audience...")
        res = await client.post(f"{API_URL}/broadcasts", json={
            "name": "Test Broadcast 2",
            "from_email": "onboarding@resend.dev",
            "subject": "Test",
            "html": "<p>test</p>",
            "audience_id": audience_id
        }, headers=headers)
        results.append(("Create Broadcast With Audience", res.status_code, res.text))
        
        if res.status_code == 200:
            b_id = res.json().get('id')
            if b_id:
                res2 = await client.post(f"{API_URL}/broadcasts/{b_id}/send", headers=headers)
                results.append(("Send Broadcast", res2.status_code, res2.text))
                
        # Test Single Email Send
        print("Testing Single Email Send...")
        res = await client.post(f"{API_URL}/emails/send", json={
            "from_email": "onboarding@resend.dev",
            "to": ["test@example.com"],
            "subject": "Test Single",
            "html": "<p>Hello</p>"
        }, headers=headers)
        results.append(("Send Single Email", res.status_code, res.text))
        
        # Test Templates
        print("Testing Templates...")
        res = await client.post(f"{API_URL}/templates", json={
             "name": "Testing Template"
        }, headers=headers)
        results.append(("Create Template no HTML", res.status_code, res.text))
        
        res = await client.post(f"{API_URL}/templates", json={
             "name": "Testing Template",
             "html": "<p>hello</p>"
        }, headers=headers)
        results.append(("Create Template with HTML", res.status_code, res.text))

    print("\n\n=== RESULTS ===")
    for r in results:
        print(f"[{r[0]}] Status: {r[1]}")
        print(f"Response: {r[2]}")

if __name__ == "__main__":
    asyncio.run(test_all())
