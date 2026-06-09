using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

namespace SportLoungeLauncher
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            string url = "https://client-gilt-six-38.vercel.app";
            string args = "--app=" + url;

            // Paths to Chrome and Edge on Windows
            string chromePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe");
            string chromePathX86 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe");
            string edgePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe");
            string edgePath64 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe");

            bool launched = false;

            // 1. Try launching Chrome (64-bit) in Standalone App Mode
            if (File.Exists(chromePath))
            {
                try { Process.Start(chromePath, args); launched = true; } catch { }
            }
            // 2. Try launching Chrome (32-bit) in Standalone App Mode
            if (!launched && File.Exists(chromePathX86))
            {
                try { Process.Start(chromePathX86, args); launched = true; } catch { }
            }
            // 3. Try launching Edge (64-bit) in Standalone App Mode
            if (!launched && File.Exists(edgePath64))
            {
                try { Process.Start(edgePath64, args); launched = true; } catch { }
            }
            // 4. Try launching Edge (32-bit) in Standalone App Mode
            if (!launched && File.Exists(edgePath))
            {
                try { Process.Start(edgePath, args); launched = true; } catch { }
            }

            // 5. Fallback: Launch default browser if no Chromium browser was launched
            if (!launched)
            {
                try
                {
                    Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Не удалось запустить приложение: " + ex.Message, "SPORT LOUNGE", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }
    }
}
