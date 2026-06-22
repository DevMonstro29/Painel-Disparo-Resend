import asyncio
import traceback
from services.resend_service import resend_service

async def run():
    print('Creating broadcast...')
    try:
        res = await resend_service.create_broadcast(
            name='Test Errors',
            from_email='onboarding@resend.dev',
            subject='Testing',
            html='<h1>Test</h1>',
            audience_id=None
        )
        print('Create Res:', res)
        if res.get('success') and 'id' in res:
            print('Sending...')
            res2 = await resend_service.send_broadcast(broadcast_id=res['id'])
            print('Send Res:', res2)
    except Exception as e:
        traceback.print_exc()

asyncio.run(run())
