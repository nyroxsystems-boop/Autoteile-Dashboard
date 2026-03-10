import { User, Mail, Clock, ExternalLink, Headphones, MessageCircle } from 'lucide-react';

export function SupportTab() {
    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                    <User className="w-5 h-5 text-primary" />
                    <h3 className="text-foreground font-medium">Ihr persönlicher Ansprechpartner</h3>
                </div>
                <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl">
                    <div className="flex items-start gap-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl ring-4 ring-blue-500/20 flex-shrink-0">
                            PU
                        </div>
                        <div className="flex-1">
                            <div className="mb-4">
                                <div className="text-xl font-semibold text-foreground mb-1">PartsUnion Support</div>
                                <div className="text-sm text-muted-foreground">Technischer Support & Account-Hilfe</div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <a href="mailto:support@partsunion.de"
                                    className="flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group">
                                    <Mail className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                    <div className="text-left">
                                        <div className="text-xs text-muted-foreground">E-Mail</div>
                                        <div className="text-sm font-medium text-foreground">support@partsunion.de</div>
                                    </div>
                                </a>
                                <a href="https://partsunion.de" target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group">
                                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                    <div className="text-left">
                                        <div className="text-xs text-muted-foreground">Website</div>
                                        <div className="text-sm font-medium text-foreground">partsunion.de</div>
                                    </div>
                                </a>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-sm">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-muted-foreground">Mo-Fr 09:00-17:00 Uhr</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-6">Support-Ressourcen</h3>
                <div className="space-y-3">
                    {[
                        { icon: Headphones, color: 'primary', label: 'Technischer Support', desc: '24/7 Support bei technischen Problemen' },
                        { icon: MessageCircle, color: 'blue-600', label: 'Live Chat', desc: 'Schnelle Antworten im Chat' },
                        { icon: ExternalLink, color: 'green-600', label: 'Wissensdatenbank', desc: 'Tutorials, FAQs und Anleitungen' },
                    ].map((item) => (
                        <a key={item.label} href="#"
                            className="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:border-border-strong transition-all group">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg bg-${item.color}/10 flex items-center justify-center`}>
                                    <item.icon className={`w-5 h-5 text-${item.color}`} />
                                </div>
                                <div>
                                    <div className="font-medium text-foreground">{item.label}</div>
                                    <div className="text-sm text-muted-foreground">{item.desc}</div>
                                </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                        </a>
                    ))}
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-6">Service Level</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-background border border-border rounded-lg">
                        <div className="text-2xl font-bold text-foreground mb-1">&lt; 2h</div>
                        <div className="text-sm text-muted-foreground">Durchschn. Antwortzeit</div>
                    </div>
                    <div className="p-4 bg-background border border-border rounded-lg">
                        <div className="text-2xl font-bold text-foreground mb-1">99.9%</div>
                        <div className="text-sm text-muted-foreground">Verfügbarkeit</div>
                    </div>
                    <div className="p-4 bg-background border border-border rounded-lg">
                        <div className="text-2xl font-bold text-foreground mb-1">4.9/5</div>
                        <div className="text-sm text-muted-foreground">Kundenzufriedenheit</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
