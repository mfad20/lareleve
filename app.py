import os
from functools import wraps
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from datetime import datetime
import re

app = Flask(__name__)
_secret_key = os.environ.get('SECRET_KEY')
if not _secret_key:
    raise ValueError("SECRET_KEY environment variable must be set")
app.config['SECRET_KEY'] = _secret_key
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///lareleve.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 86400  # 24h cache navigateur

# ── Flask-Mail (Gmail SMTP) ──────────────────────────────
app.config['MAIL_SERVER']   = 'smtp.gmail.com'
app.config['MAIL_PORT']     = 587
app.config['MAIL_USE_TLS']  = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')

db   = SQLAlchemy(app)
mail = Mail(app)

# ──────────────────────────────────────────────
# CACHE-BUSTING : version des assets (mtime des fichiers statiques).
# Chaque déploiement régénère l'URL → le navigateur recharge CSS/JS.
# ──────────────────────────────────────────────
import time

def _assets_version():
    paths = [
        'static/css/main.css', 'static/css/photos.css',
        'static/js/main.js', 'static/js/three-bg.js',
    ]
    latest = 0
    for p in paths:
        fp = os.path.join(app.root_path, p)
        try:
            latest = max(latest, int(os.path.getmtime(fp)))
        except OSError:
            pass
    return latest or int(time.time())

@app.context_processor
def inject_assets_version():
    return {'assets_v': _assets_version()}

# ──────────────────────────────────────────────
# MODELS
# ──────────────────────────────────────────────

class Contact(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    telephone = db.Column(db.String(20), nullable=True)
    message = db.Column(db.Text, nullable=False)
    date_envoi = db.Column(db.DateTime, default=datetime.utcnow)
    lu = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f'<Contact {self.nom}>'

# ──────────────────────────────────────────────
# DATA
# ──────────────────────────────────────────────

MEMBRES = [
    {
        "id": 1,
        "nom": "ASSOUMOU Tanoh Raoul Martial",
        "prenom": "Raoul Martial",
        "poste": "Président",
        "niveau": "ISE2",
        "contact": "+225 07 69 95 46 32",
        "email": "raoul.assoumou@ensea.edu.ci",
        "initiales": "AM",
        "couleur": "#D4AF37",
        "photo": "president.jpg",
        "vie_associative": [
            "Chargé de la vie scolaire à l'AJBRA",
            "Encadreur au Valideur LMD",
            "Manager général du Valideur LMD"
        ],
        "description": "Leader naturel et bâtisseur de ponts, Raoul Martial porte la vision d'une DISE unie et ambitieuse. Sa double expertise en vie associative et management en fait le pilier de la liste."
    },
    {
        "id": 2,
        "nom": "BIYEN Abdoul Fadoul",
        "prenom": "Abdoul Fadoul",
        "poste": "Vice-Président",
        "niveau": "ISE2",
        "contact": "+225 01 51 67 54 57",
        "email": "fadoul.biyen@ensea.edu.ci",
        "initiales": "BF",
        "couleur": "#3B82F6",
        "photo": "vice_president.jpg",
        "vie_associative": [
            "Commission Marketing & Communication EJS (2024-2025)",
            "Secrétaire Général AMEB (2025-2026)",
            "Vice-Président AICP (2025-2026)",
            "Commission Communication AES (2025-2026)"
        ],
        "description": "Stratège en communication et marketing, Abdoul Fadoul apporte une expertise solide et une vision moderne de la communication institutionnelle."
    },
    {
        "id": 3,
        "nom": "TCHUIDJANG Jorex IVAN",
        "prenom": "Jorex Ivan",
        "poste": "Secrétaire Général",
        "niveau": "ISE2",
        "contact": "+237 65 58 29 773",
        "email": "tchuidjangjorexe@gmail.com",
        "initiales": "TJ",
        "couleur": "#0F3460",
        "photo": "secretaire_general.jpg",
        "vie_associative": [
            "Président Commission Suivi & Assistance Académique CEMAC",
            "Membre Commission Formation DISE"
        ],
        "description": "Organisateur rigoureux et académicien passionné, Jorex Ivan garantit l'excellence des processus internes et le suivi académique des membres de la DISE."
    },
    {
        "id": 4,
        "nom": "BOMISSO Richard",
        "prenom": "Richard",
        "poste": "Secrétaire Général Adjoint",
        "niveau": "ISE Éco",
        "contact": "+225 07 47 18 1179",
        "email": "richard.bomisso.ensea@edu.ci",
        "initiales": "BR",
        "couleur": "#3B82F6",
        "photo": "secretaire_general_adjoint.jpg",
        "vie_associative": [
            "Commissaire au compte de la DISE (2025-2026)",
            "Directeur Marketing Club Ecostat (2023-2024)",
            "Chargé à la rédaction Fack is Back (2024-2025)",
            "Responsable Organisation GBU ENSEA (2024-2025)"
        ],
        "description": "Expert en communication et économie, Richard apporte une maîtrise du marketing digital et de la rédaction institutionnelle au service de la visibilité de la DISE."
    },
    {
        "id": 5,
        "nom": "EDI Samirah Anne Océane",
        "prenom": "Anne Océane",
        "poste": "Trésorière Principale",
        "niveau": "ISE2",
        "contact": "+225 01 43 37 7116",
        "email": "anneedi394@gmail.com",
        "initiales": "ES",
        "couleur": "#D4AF37",
        "photo": "tresoriere_principale.jpg",
        "vie_associative": [
            "Trésorerie 2ALSY-ENSEA (2025-2026)",
            "Trésorerie 2ALSY-INPHB (2022-2024)",
            "Conseiller LABEL PRESTIGE (2023-2024)",
            "Chargée à l'organisation AES (2025-2026)"
        ],
        "description": "Gestionnaire rigoureuse et expérimentée, Anne Océane assure la santé financière de la liste avec professionnalisme. Son parcours multi-institutionnel garantit une gestion transparente."
    },
    {
        "id": 6,
        "nom": "KISSIEDOU Sephora Hermine",
        "prenom": "Sephora Hermine",
        "poste": "Trésorière Adjointe",
        "niveau": "ISE1 Maths",
        "contact": "+225 01 41 95 7977",
        "email": "herminekiessidou@gmail.com",
        "initiales": "KS",
        "couleur": "#3B82F6",
        "photo": "tresoriere_adjointe.jpg",
        "vie_associative": [
            "Membre active de la DISE",
            "ISE1 Mathématiques - Profil analytique"
        ],
        "description": "Mathématicienne de formation, Sephora Hermine apporte rigueur analytique et fraîcheur au bureau. Sa présence garantit le lien entre la liste et les ISE1 de la DISE."
    }
]

PROGRAMME = {
    "traditionnel": [
        {"titre": "Grande Rentrée des ISE", "icone": "graduation-cap", "description": "Accueil officiel et intégration des nouvelles promotions ISE dans la famille DISE."},
        {"titre": "ISEChampionship", "icone": "trophy", "description": "Compétition sportive et intellectuelle phare de la DISE, renforçant la cohésion entre niveaux."},
        {"titre": "RDV des Experts", "icone": "briefcase", "description": "Rencontres régulières avec des professionnels et aînés du monde de la statistique et de l'économie."},
        {"titre": "Dîner Gala", "icone": "sparkles", "description": "Soirée d'excellence célébrant les lauréats et renforçant les liens entre membres de la DISE."},
        {"titre": "Rencontres Aînés-Cadets", "icone": "handshake", "description": "Panels intergénérationnels pour renforcer les liens entre anciens et nouveaux membres de la DISE."},
        {"titre": "Marathon des ISE", "icone": "activity", "description": "Événement sportif symbolisant l'endurance et la persévérance des ISE."},
        {"titre": "Vente de Gadgets", "icone": "shirt", "description": "Polos, tee-shirts, casquettes et vêtements aux couleurs de la Céleste Division."}
    ],
    "restructuration": [
        {"titre": "Cartes de Félicitation", "icone": "gift", "description": "Envoi de cartes aux nouveaux lauréats bien avant le bootcamp, pour un accueil chaleureux dès la réussite."},
        {"titre": "Boutique de l'Expert", "icone": "shopping-bag", "description": "Retour de la boutique institutionnelle avec une gamme élargie de produits DISE."},
        {"titre": "Activités Détente", "icone": "gamepad-2", "description": "Moments de cohésion et de bien-être pour équilibrer l'exigence académique."},
        {"titre": "Simulation d'Entretien", "icone": "target", "description": "Préparation intensive aux entretiens d'embauche avec des professionnels RH."},
        {"titre": "Formation Recherche d'Emploi", "icone": "bar-chart-2", "description": "Ateliers pratiques sur les techniques modernes de recherche d'emploi."}
    ],
    "innovations": [
        {
            "titre": "Pré-Akwaba",
            "icone": "star",
            "badge": "Accueil & Intégration",
            "description": "Dispositif d'accueil innovant pour les nouveaux, créant un sentiment d'appartenance immédiat dès leur admission à l'ENSEA.",
            "impact": "Intégration immédiate"
        },
        {
            "titre": "Site Web de la DISE",
            "icone": "globe",
            "badge": "Innovation Digitale",
            "description": "Une mémoire vivante de la Céleste Division : historique, annuaire des aînés, archives des grands moments. Un pont entre générations, accessible depuis le monde entier.",
            "impact": "Portée internationale"
        },
        {
            "titre": "Mois de la Statisticienne",
            "icone": "user-check",
            "badge": "Inclusion & Diversité",
            "description": "Un mois entier dédié aux femmes statisticiennes : parcours exemplaires, conférences, actions dans les lycées. Valoriser et inspirer la nouvelle génération féminine.",
            "impact": "Égalité & Inspiration"
        },
        {
            "titre": "Podcast Expert Prêche",
            "icone": "mic",
            "badge": "Influence Digitale",
            "description": "Série de vidéos mensuelles avec aînés et experts sur la data, l'économie, l'insertion professionnelle. Diffusés sur tous les canaux pour révéler les capacités du statisticien.",
            "impact": "Visibilité nationale"
        },
        {
            "titre": "Journée de l'Expert",
            "icone": "mic-2",
            "badge": "Rayonnement",
            "description": "Une journée de panels thématiques ouverte aux étudiants d'autres écoles. Chaque panel traite d'actualités statistiques et économiques avec plusieurs aînés experts.",
            "impact": "Ouverture inter-écoles"
        },
        {
            "titre": "20 Ans de la Céleste",
            "icone": "cake",
            "badge": "Mémoire & Fraternité",
            "description": "Grande soirée anniversaire avec témoignages d'aînés de toutes générations, rétrospective en images et moments de fraternité entre anciens et actuels membres.",
            "impact": "Événement historique"
        }
    ]
}

CHIFFRES = [
    {"valeur": 6, "label": "Membres de la liste", "suffix": "", "icone": "users"},
    {"valeur": 13, "label": "Expériences associatives", "suffix": "+", "icone": "award"},
    {"valeur": 6, "label": "Innovations majeures", "suffix": "", "icone": "lightbulb"},
    {"valeur": 20, "label": "Ans de la Céleste à célébrer", "suffix": "", "icone": "cake"},
    {"valeur": 100, "label": "Engagement total", "suffix": "%", "icone": "flame"},
    {"valeur": 7, "label": "Activités traditionnelles", "suffix": "", "icone": "calendar"}
]

VALEURS = [
    {
        "titre": "Excellence",
        "icone": "star",
        "description": "Héritiers d'une tradition d'exigence, nous maintenons les standards les plus élevés dans chaque action entreprise."
    },
    {
        "titre": "Unité",
        "icone": "handshake",
        "description": "ISE1, ISE2, ISE3 : une seule famille. Nous construisons des ponts entre promotions et parcours."
    },
    {
        "titre": "Innovation",
        "icone": "lightbulb",
        "description": "Sans renier notre héritage, nous apportons de nouvelles idées pour propulser la DISE dans le futur."
    },
    {
        "titre": "Influence",
        "icone": "globe-2",
        "description": "Nous voulons que chaque ISE soit reconnu partout sur le continent africain comme un expert incontournable."
    }
]

# ──────────────────────────────────────────────
# EMAIL
# ──────────────────────────────────────────────

MAIL_RECIPIENT = os.environ.get('MAIL_RECIPIENT', 'mfad09012002@gmail.com')

def _send_contact_email(nom, email, telephone, message):
    if not app.config.get('MAIL_USERNAME') or not app.config.get('MAIL_PASSWORD'):
        return
    try:
        tel_line = f"Téléphone : {telephone}\n" if telephone else ""
        msg = Message(
            subject=f"[La Relève] Nouveau message de {nom}",
            sender=app.config['MAIL_USERNAME'],
            recipients=[MAIL_RECIPIENT],
            reply_to=email,
            body=(
                f"Nom     : {nom}\n"
                f"Email   : {email}\n"
                f"{tel_line}"
                f"\nMessage :\n{message}\n"
            )
        )
        mail.send(msg)
    except Exception:
        pass  # ne bloque pas la sauvegarde si l'email échoue

# ──────────────────────────────────────────────
# ADMIN AUTH
# ──────────────────────────────────────────────

ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD')
if not ADMIN_PASSWORD:
    raise ValueError("ADMIN_PASSWORD environment variable must be set")

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated

# ──────────────────────────────────────────────
# ROUTES
# ──────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html',
                           membres=MEMBRES[:4],
                           chiffres=CHIFFRES,
                           valeurs=VALEURS,
                           programme=PROGRAMME)

@app.route('/equipe')
def equipe():
    return render_template('equipe.html', membres=MEMBRES)

@app.route('/programme')
def programme():
    return render_template('programme.html', programme=PROGRAMME)

@app.route('/vision')
def vision():
    return render_template('vision.html')

@app.route('/contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'POST':
        if request.is_json:
            data = request.get_json(silent=True) or {}
            nom       = data.get('nom', '').strip()
            email     = data.get('email', '').strip()
            telephone = data.get('telephone', '').strip()
            message   = data.get('message', '').strip()
        else:
            nom       = request.form.get('nom', '').strip()
            email     = request.form.get('email', '').strip()
            telephone = request.form.get('telephone', '').strip()
            message   = request.form.get('message', '').strip()

        # Validation
        errors = []
        if not nom or len(nom) < 2:
            errors.append("Le nom doit contenir au moins 2 caractères.")
        if not email or not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
            errors.append("Adresse email invalide.")
        if not message or len(message) < 10:
            errors.append("Le message doit contenir au moins 10 caractères.")

        if errors:
            if request.is_json:
                return jsonify({"success": False, "errors": errors}), 400
            for e in errors:
                flash(e, 'error')
            return redirect(url_for('contact'))

        # Save to DB
        try:
            nouveau_contact = Contact(
                nom=nom,
                email=email,
                telephone=telephone if telephone else None,
                message=message
            )
            db.session.add(nouveau_contact)
            db.session.commit()

            # Send email notification if mail is configured
            _send_contact_email(nom, email, telephone, message)

            if request.is_json:
                return jsonify({
                    "success": True,
                    "message": "Votre message a été envoyé avec succès. La Relève vous répondra très prochainement."
                })
            flash("Message envoyé avec succès !", 'success')
            return redirect(url_for('contact'))

        except Exception as e:
            db.session.rollback()
            if request.is_json:
                return jsonify({"success": False, "errors": ["Erreur serveur. Veuillez réessayer."]}), 500
            flash("Erreur lors de l'envoi. Veuillez réessayer.", 'error')
            return redirect(url_for('contact'))

    return render_template('contact.html')

@app.route('/admin')
@admin_required
def admin():
    return redirect(url_for('admin_messages'))

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        if request.form.get('password', '') == ADMIN_PASSWORD:
            session['admin_logged_in'] = True
            return redirect(url_for('admin_messages'))
        flash('Mot de passe incorrect.', 'error')
    return render_template('admin_login.html')

@app.route('/admin/messages')
@admin_required
def admin_messages():
    messages = Contact.query.order_by(Contact.date_envoi.desc()).all()
    non_lus = sum(1 for m in messages if not m.lu)
    return render_template('admin_messages.html', messages=messages, non_lus=non_lus)

@app.route('/admin/marquer-lu/<int:id>', methods=['POST'])
@admin_required
def admin_marquer_lu(id):
    msg = Contact.query.get_or_404(id)
    msg.lu = not msg.lu
    db.session.commit()
    return redirect(url_for('admin_messages'))

@app.route('/admin/supprimer/<int:id>', methods=['POST'])
@admin_required
def admin_supprimer(id):
    msg = Contact.query.get_or_404(id)
    db.session.delete(msg)
    db.session.commit()
    return redirect(url_for('admin_messages'))

@app.route('/admin/logout')
def admin_logout():
    session.pop('admin_logged_in', None)
    return redirect(url_for('admin_login'))

@app.route('/robots.txt')
def robots():
    return app.response_class(
        "User-agent: *\nAllow: /\nSitemap: /sitemap.xml\n",
        mimetype='text/plain'
    )

@app.route('/sitemap.xml')
def sitemap():
    base = "https://lareleve-dise.com"
    pages = ['/', '/equipe', '/programme', '/vision', '/contact']
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for p in pages:
        xml += f'  <url><loc>{base}{p}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n'
    xml += '</urlset>'
    return app.response_class(xml, mimetype='application/xml')

# ──────────────────────────────────────────────
# INIT DB
# ──────────────────────────────────────────────

def init_db():
    with app.app_context():
        db.create_all()

# Initialisation au démarrage (Gunicorn n'exécute pas __main__)
init_db()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
