using System.Device.I2c;
using Iot.Device.Common;
using Iot.Device.Pn532;
using Iot.Device.Pn532.AsTarget;


namespace emulate{
    class Program{
        static void Main(string[] args){
            Pn532 pn532;

            pn532 = new Pn532(I2cDevice.Create(new I2cConnectionSettings(1, Pn532.I2cDefaultAddress)));

            if (pn532.FirmwareVersion is FirmwareVersion version)
            {
                Console.WriteLine(
                    $"Is it a PN532!: {version.IsPn532}, Version: {version.Version}, Version supported: {version.VersionSupported}");
                AsTarget(pn532,args[0]);

            }
            else
            {
                Console.WriteLine($"Error");
            }

            pn532?.Dispose();
        }
        static void AsTarget(Pn532 pn532, string uidHexString)
        {
            byte[] bytes = new byte[uidHexString.Length / 2];
            for (int i = 0; i < uidHexString.Length; i += 2)
                bytes[i/2] = Convert.ToByte(uidHexString.Substring(i, 2), 16);
            Console.WriteLine(BitConverter.ToString(bytes));   
            Console.WriteLine(uidHexString);

            byte[]? retData = null;
            TargetModeInitialized? modeInitialized = null;
            while (true)
            {
                (modeInitialized, retData) = pn532.InitAsTarget(
                    TargetModeInitialization.PiccOnly, 
                    new TargetMifareParameters() { Atqa = new byte[] { 0x08, 0x00 }, NfcId3 = bytes, Sak = 0x60 },
                    new TargetFeliCaParameters() { NfcId2 = new byte[] { 0, 0, 0, 0, 0, 0, 0, 0 }, Pad = new byte[] { 0, 0, 0, 0, 0, 0, 0, 0 }, SystemCode = new byte[] {0, 0} },
                    new TargetPiccParameters() { NfcId3 = new byte[] { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }, GeneralTarget = new byte[0], HistoricalTarget = new byte[0] }
                );
                if (modeInitialized is object)
                    break;

                // Give time to PN532 to process
                Thread.Sleep(200);
            }
            if (modeInitialized is null)
                return;

            Console.WriteLine($"PN532 as a target: ISDep: {modeInitialized.IsDep}, IsPicc {modeInitialized.IsISO14443_4Picc}, {modeInitialized.TargetBaudRate}, {modeInitialized.TargetFramingType}");
            Console.WriteLine($"Initiator: {BitConverter.ToString(retData)}");


            Span<byte> read = stackalloc byte[512];
            int ret = -1;
            while (ret<0)
                ret = pn532.ReadDataAsTarget(read);

            // For example: 00-00-A4-04-00-0E-32-50-41-59-2E-53-59-53-2E-44-44-46-30-31-00
            Console.WriteLine($"Status: {read[0]}, Data: {BitConverter.ToString(read.Slice(1).ToArray())}");
        }
    }
}



