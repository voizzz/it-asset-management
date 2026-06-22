import { NextResponse } from 'next/server';
import net from 'net';

function checkPort(ip: string, port: number, timeout = 1500): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let status = false;

    socket.on('connect', () => {
      status = true;
      socket.destroy();
    });

    socket.setTimeout(timeout);
    socket.on('timeout', () => {
      status = false;
      socket.destroy();
    });

    socket.on('error', () => {
      status = false;
    });

    socket.on('close', () => {
      resolve(status);
    });

    socket.connect(port, ip);
  });
}

export async function POST(request: Request) {
  try {
    const { subnet } = await request.json();
    if (!subnet) return NextResponse.json({ error: 'Subnet required' }, { status: 400 });

    const baseIp = subnet.substring(0, subnet.lastIndexOf('.'));
    const results = [];
    
    // Scan .1 to .254
    // Note: In a real app this should be batched to avoid hitting socket limits
    // We'll just do a fast parallel scan with small timeout
    const promises = [];
    for (let i = 1; i <= 254; i++) {
      const ip = `${baseIp}.${i}`;
      promises.push(
        (async () => {
          const isWindows = await checkPort(ip, 135, 1000); // WMI/RPC port
          const isWeb = await checkPort(ip, 80, 1000); // Web port
          const isSsh = await checkPort(ip, 22, 1000); // SSH
          
          if (isWindows || isWeb || isSsh) {
            let type = 'Unknown Device';
            if (isWindows) type = 'Windows PC/Server';
            else if (isSsh) type = 'Linux/Network Device';
            else if (isWeb) type = 'Web Interface / Printer';
            
            results.push({ ip, type, isWindows, isWeb, isSsh });
          }
        })()
      );
    }
    
    await Promise.all(promises);

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
