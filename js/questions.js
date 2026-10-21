window.EXAM = {
  title: "Evaluación interna EKS / Kubernetes",
  subtitle: "Test rápido de operación EKS",
  passMark: 6,
  scale: 10,
  questions: [
    {
      topic: "eks",
      topicLabel: "EKS específico",
      q: "En un cluster EKS, ¿qué administra AWS y qué administrás vos?",
      options: [
        "AWS corre tus Pods de negocio; vos solo pagás el control plane.",
        "AWS administra nodos, CNI y todos los add-ons; vos solo hacés kubectl apply.",
        "AWS administra el control plane (API server, etcd). Vos administrás nodos (o Karpenter), add-ons, red, IAM de las apps y los workloads.",
        "EKS no tiene control plane: el API server corre en tus EC2."
      ],
      answer: 2,
      explain: "EKS es control plane administrado. Si se cae un add-on, el CNI o un NodePool, es tu problema: el control plane puede estar sano y el cluster igual no schedulea Pods."
    },
    {
      topic: "net",
      topicLabel: "Networking / CNI",
      q: "Con el AWS VPC CNI por defecto, ¿de dónde sale la IP de cada Pod?",
      options: [
        "De la subnet de la VPC: el CNI asigna IPs de las ENI del nodo. El Pod es ruteable en la VPC y consume IPs de la subnet.",
        "De un overlay VXLAN interno, invisible para la VPC.",
        "Del Service ClusterIP 10.100.0.0/16, compartida entre todos los Pods del nodo.",
        "De 169.254.0.0/16, con NAT a la IP del nodo."
      ],
      answer: 0,
      explain: "Cada Pod tiene una IP real de la subnet. Subnet chica = Pods Pending por falta de IPs. Security groups y rutas de VPC aplican al Pod, no hay overlay tipo Flannel."
    },
    {
      topic: "iam",
      topicLabel: "IAM: IRSA / Pod Identity",
      q: "Una app en EKS tiene que leer un secreto de Secrets Manager. ¿Qué está mal?",
      options: [
        "Usar IRSA o EKS Pod Identity: un rol IAM distinto por ServiceAccount.",
        "Anotar el ServiceAccount con el ARN del rol y que el trust policy apunte al OIDC del cluster.",
        "Restringir el rol al secreto concreto (least privilege).",
        "Dejar que el Pod use el instance profile del nodo: todos los Pods del nodo heredan los mismos permisos."
      ],
      answer: 3,
      explain: "El instance profile es para kubelet/CNI. Si la app lo usa, un Pod comprometido puede hacer lo que haga el nodo. IRSA o Pod Identity aíslan el permiso por ServiceAccount."
    },
    {
      topic: "karpenter",
      topicLabel: "Karpenter",
      q: "Hay Pods Pending por CPU y Karpenter está instalado. ¿Qué tiene que existir para que cree nodos?",
      options: [
        "Un Auto Scaling Group con el mismo nombre del Deployment.",
        "Solo un HPA: Karpenter escala réplicas, no máquinas.",
        "Un NodePool (qué Pods acepta, Spot/On-Demand, límites) y un EC2NodeClass (AMI, subnets, security groups, rol del nodo).",
        "Nada: Karpenter crea un t3.medium por cada Pod, siempre."
      ],
      answer: 2,
      explain: "Karpenter no mira Deployments ni HPA. Mira Pods Pending y busca un NodePool cuyos requirements calcen. Sin NodePool/NodeClass no lanza EC2. El HPA escala réplicas; Karpenter escala nodos."
    },
    {
      topic: "alb",
      topicLabel: "AWS Load Balancer Controller",
      q: "El ALB ya lo crea Terraform. ¿Cómo registrás los Pods como targets sin que el controller arme otro load balancer?",
      options: [
        "Con TargetGroupBinding: el TG existe afuera y el controller solo registra IPs de Pods.",
        "Con un Service ClusterIP: Route 53 apunta al ClusterIP y listo.",
        "Con un Ingress sin annotations: siempre crea un ALB nuevo.",
        "Con hostNetwork: true en todos los Deployments."
      ],
      answer: 0,
      explain: "Ingress = el controller crea el ALB. TargetGroupBinding = el ALB/TG ya existe (Terraform) y solo se enganchan los Pods. ClusterIP no es ruteable desde Internet."
    },
    {
      topic: "kubectl",
      topicLabel: "kubectl",
      q: "Un Pod está en CrashLoopBackOff. ¿Qué hacés primero?",
      options: [
        "kubectl delete pod y esperar que vuelva sano.",
        "kubectl port-forward al 80: si no abre, el cluster está caído.",
        "Volver a aplicar el mismo manifest: siempre corta el loop.",
        "kubectl logs --previous, kubectl describe pod (Events y Last State) y mirar el exit code."
      ],
      answer: 3,
      explain: "El contenedor arranca y muere. Los logs de la corrida anterior y el Last State dicen si fue OOM, error de app o probe. Borrar el Pod sin leer eso solo reinicia el ciclo."
    },
    {
      topic: "debug",
      topicLabel: "Troubleshooting",
      q: "El Pod queda Pending: `0/4 nodes are available: Insufficient cpu`. ¿Qué implica?",
      options: [
        "El control plane de EKS está caído.",
        "El scheduler no encuentra un nodo con CPU libre que cumpla requests/taints. Hay que bajar requests o que Karpenter/el node group cree capacidad.",
        "Siempre es CoreDNS: sin DNS el Pod no pasa a Running.",
        "Pending significa que la imagen no existe (ImagePullBackOff)."
      ],
      answer: 1,
      explain: "Pending = no scheduled. ImagePullBackOff es después de assigned a un nodo. Control plane caído ni siquiera te deja hacer kubectl con normalidad."
    },
    {
      topic: "spot",
      topicLabel: "Spot en Kubernetes",
      q: "Vas a correr workloads en nodos Spot. ¿Qué es lo mínimo para que una interrupción no tumbe el servicio?",
      options: [
        "Un solo Pod en Spot: así no hay réplicas que coordinar.",
        "Anotar el Ingress con alb.ingress.kubernetes.io/spot=true: el ALB cancela la interrupción.",
        "Varias réplicas más un PodDisruptionBudget, y que Karpenter (o el drain) evicte respetando ese PDB. La app tiene que tolerar que el nodo desaparezca.",
        "IRSA renueva el token y eso evita que AWS retire la instancia."
      ],
      answer: 2,
      explain: "Spot puede desaparecer con ~2 minutos de aviso. Sin réplicas y sin PDB se evictan todos los Pods a la vez. IAM no tiene nada que ver con la interrupción. Spot no sirve para un único Pod de estado sin réplica."
    },
    {
      topic: "gitops",
      topicLabel: "GitOps / ArgoCD",
      q: "En GitOps con ArgoCD, ¿cuál es la fuente de verdad del cluster?",
      options: [
        "El repo Git (manifests/Helm/Kustomize). ArgoCD reconcilia el cluster hacia ese estado.",
        "Lo que está Running: si alguien hace kubectl edit, Git se actualiza solo.",
        "La consola de EKS: cada click genera un commit.",
        "El Secret de la release de Helm en kube-system."
      ],
      answer: 0,
      explain: "Git declara, ArgoCD aplica. Un kubectl edit en prod es drift: o se commitea o SelfHeal lo pisa."
    },
    {
      topic: "upgrades",
      topicLabel: "Upgrades de Kubernetes",
      q: "¿Cuál es el orden seguro para subir la versión de Kubernetes en EKS?",
      options: [
        "Nodos primero, después add-ons, al final el control plane.",
        "Saltar de 1.28 a 1.32 en el mismo apply de Terraform.",
        "Solo add-ons: el control plane de EKS se actualiza solo.",
        "Control plane → add-ons compatibles (vpc-cni, kube-proxy, coredns, CSI, LBC) → nodos/AMI. De a una minor version."
      ],
      answer: 3,
      explain: "AWS exige de a una minor. El kubelet no puede ser más nuevo que la API. Add-ons viejos después del control plane son la causa típica de incidentes en el upgrade."
    }
  ]
};
