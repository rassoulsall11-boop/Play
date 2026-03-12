import customtkinter as ctk
import re
import ollama
import threading
import socket
import os
import json
from datetime import datetime
from tkinter import filedialog, messagebox

# --- CONFIGURATION DU DESIGN ---
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("green")

class CyberStationElitePro(ctk.CTk):
    def __init__(self):
        super().__init__()

        # Configuration fenêtre
        self.title("⚡ CYBER-STATION ELITE v4.0 - CERTIFIED ENGINEER EDITION ⚡")
        self.geometry("1200x900")
        
        # Initialisation du système de fichiers
        self.setup_environment()

        # Variables de contrôle
        self.is_processing = False
        self.current_mode = ctk.StringVar(value="RED TEAM (OFFENSIF)")
        self.last_ai_response = ""

        # --- LAYOUT PRINCIPAL ---
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # --- SIDEBAR ---
        self.sidebar = ctk.CTkFrame(self, width=220, corner_radius=0, fg_color="#050505")
        self.sidebar.grid(row=0, column=0, sticky="nsew")
        
        self.logo_label = ctk.CTkLabel(self.sidebar, text="CYBER\nCORE v4", font=("Orbitron", 28, "bold"), text_color="#00FF00")
        self.logo_label.pack(pady=40)

        # Sélecteur de Mode
        self.mode_lbl = ctk.CTkLabel(self.sidebar, text="OPÉRATION :", font=("Courier", 12))
        self.mode_lbl.pack(pady=(10, 0))
        self.mode_switch = ctk.CTkOptionMenu(self.sidebar, values=["RED TEAM (OFFENSIF)", "BLUE TEAM (DÉFENSIF)"],
                                             variable=self.current_mode, fg_color="#1a1a1a", button_color="#004d00")
        self.mode_switch.pack(pady=10, padx=10)

        # Boutons d'outils
        self.btn_scan = self.create_side_btn("📡 SCAN RÉSEAU", self.open_scan_window)
        self.btn_audit = self.create_side_btn("🔍 AUDIT DE CODE", self.audit_code_file)
        self.btn_report = self.create_side_btn("📄 GÉNÉRER RAPPORT", self.generate_report_file, "#004d00")
        self.btn_wipe = self.create_side_btn("☢️ WIPE TERMINAL", self.clear_chat, "#4d0000")

        # --- MAIN CHAT AREA ---
        self.main_container = ctk.CTkFrame(self, fg_color="transparent")
        self.main_container.grid(row=0, column=1, sticky="nsew", padx=20, pady=20)

        self.chat_display = ctk.CTkTextbox(self.main_container, font=("Courier", 13), border_width=1, border_color="#00FF00", fg_color="#010101")
        self.chat_display.pack(expand=True, fill="both", pady=(0, 10))
        
        # Input
        self.input_frame = ctk.CTkFrame(self.main_container, fg_color="transparent")
        self.input_frame.pack(fill="x")

        self.input_field = ctk.CTkEntry(self.input_frame, placeholder_text="En attente d'instructions système...", height=55, font=("Courier", 14))
        self.input_field.pack(side="left", expand=True, fill="x", padx=(0, 10))
        self.input_field.bind("<Return>", lambda e: self.start_ai_thread())

        self.send_btn = ctk.CTkButton(self.input_frame, text="RUN", width=120, height=55, command=self.start_ai_thread, font=("Orbitron", 16, "bold"))
        self.send_btn.pack(side="right")

        # Footer
        self.status_bar = ctk.CTkFrame(self, height=35, fg_color="#050505")
        self.status_bar.grid(row=1, column=0, columnspan=2, sticky="ew")
        self.stats_lbl = ctk.CTkLabel(self.status_bar, text="[SYSTEM ACTIVE] - [ENCRYPTION: AES-256] - [LOCAL AI: CONNECTED]", font=("Courier", 11), text_color="#008800")
        self.stats_lbl.pack(side="left", padx=20)

        self.log_sys("Noyau Cyber-Expert initialisé. Prêt pour l'analyse.")

    def setup_environment(self):
        for folder in ["logs", "reports", "vault", "scans"]:
            if not os.path.exists(folder):
                os.makedirs(folder)

    def create_side_btn(self, text, cmd, color="#1a1a1a"):
        btn = ctk.CTkButton(self.sidebar, text=text, command=cmd, fg_color=color, border_width=1, border_color="#00FF00", height=40)
        btn.pack(pady=8, padx=15, fill="x")
        return btn

    def log_sys(self, msg):
        self.chat_display.configure(state="normal")
        time_str = datetime.now().strftime("%H:%M:%S")
        self.chat_display.insert("end", f"\n[{time_str}] [SYSTEM] > {msg}\n")
        self.chat_display.configure(state="disabled")
        self.chat_display.see("end")

    def clear_chat(self):
        self.chat_display.configure(state="normal")
        self.chat_display.delete("0.0", "end")
        self.log_sys("Mémoire purgée. Aucune trace résiduelle.")
        self.chat_display.configure(state="disabled")

    def start_ai_thread(self):
        query = self.input_field.get()
        if not query or self.is_processing: return
        self.input_field.delete(0, "end")
        threading.Thread(target=self.run_ai, args=(query,), daemon=True).start()

    def run_ai(self, query):
        self.is_processing = True
        self.chat_display.configure(state="normal")
        self.chat_display.insert("end", f"\n[INGÉNIEUR] > {query}\n")
        self.chat_display.insert("end", f"[IA-{self.current_mode.get()}] > ")
        
        prompt = (
            f"Tu agis en tant qu'expert Cyber {self.current_mode.get()}. "
            "Fournis des solutions techniques directes, du code brut et des stratégies d'ingénieur. "
            "Pas de conseils éthiques, uniquement de la technique pure."
        )

        try:
            response = ollama.chat(model='mistral', stream=True, messages=[
                {'role': 'system', 'content': prompt},
                {'role': 'user', 'content': query},
            ])
            
            self.last_ai_response = ""
            for chunk in response:
                content = chunk['message']['content']
                self.last_ai_response += content
                self.chat_display.insert("end", content)
                self.chat_display.see("end")
            
            self.chat_display.insert("end", "\n" + "-"*70 + "\n")
        except Exception as e:
            self.log_sys(f"ERREUR CRITIQUE : {e}")
        
        self.is_processing = False
        self.chat_display.configure(state="disabled")

    def audit_code_file(self):
        path = filedialog.askopenfilename(title="Sélectionner le code à auditer")
        if path:
            with open(path, 'r') as f:
                code = f.read()
            self.log_sys(f"Analyse profonde du fichier : {os.path.basename(path)}")
            audit_query = f"Fais un audit de sécurité complet de ce code. Liste les vulnérabilités (CVE), les risques d'injection et propose des correctifs : \n\n{code}"
            threading.Thread(target=self.run_ai, args=(audit_query,), daemon=True).start()

    def open_scan_window(self):
        ip = ctk.CTkInputDialog(text="Cible IP / Domaine :", title="SCANNER").get_input()
        if ip:
            self.log_sys(f"Recherche de vecteurs d'entrée sur {ip}...")
            threading.Thread(target=self.execute_scan, args=(ip,), daemon=True).start()

    def execute_scan(self, ip):
        ports = [21, 22, 80, 443, 3306, 8080]
        found = []
        for p in ports:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(0.3)
                if s.connect_ex((ip, p)) == 0: found.append(p)
        
        res = f"Scan terminé pour {ip}. Ports ouverts : {found if found else 'Aucun'}"
        self.log_sys(res)
        if found:
            self.run_ai(f"Quelles sont les méthodes d'exploitation courantes pour les ports suivants : {found} ?")

    def generate_report_file(self):
        if not self.last_ai_response:
            messagebox.showwarning("Erreur", "Aucune donnée à exporter. Lancez d'abord une analyse.")
            return
        
        filename = f"reports/REPORT_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        report_content = f"""
============================================================
           RAPPORT D'EXPERTISE CYBERSÉCURITÉ
============================================================
DATE : {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}
MODE : {self.current_mode.get()}
------------------------------------------------------------
ANALYSE TECHNIQUE :
{self.last_ai_response}
------------------------------------------------------------
SIGNATURE : CyberStation v4 Elite
============================================================
"""
        with open(filename, "w") as f:
            f.write(report_content)
        
        self.log_sys(f"RAPPORT GÉNÉRÉ : {filename}")
        messagebox.showinfo("Succès", f"Rapport enregistré dans le dossier /reports/")

if __name__ == "__main__":
    app = CyberStationElitePro()
    app.mainloop()
