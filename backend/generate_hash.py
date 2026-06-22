import sys
from getpass import getpass
from argon2 import PasswordHasher

def main():
    ph = PasswordHasher()
    print("Gerador de Hash Argon2 para Configuração Local")
    password = getpass("Digite a senha para gerar o hash: ")
    confirm = getpass("Confirme a senha: ")
    
    if password != confirm:
        print("As senhas não coincidem. Tente novamente.")
        sys.exit(1)
        
    hash_str = ph.hash(password)
    print("\nAdicione o hash abaixo no seu arquivo backend/.env:")
    print("-" * 50)
    print(f"ADMIN_PASSWORD_HASH='{hash_str}'")
    print("-" * 50)

if __name__ == "__main__":
    main()
